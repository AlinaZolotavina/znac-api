jest.mock("../utils/nodemailerTransporter", () => ({
  sendMail: jest.fn().mockResolvedValue(),
}));

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");
const User = require("../models/user");
const createUser = require("./helpers/createUser");
const createResetToken = require("./helpers/createResetToken");
const service = require("../services/userService");
const { cleanupExpiredTokens } = require("../services/expiredTokenCleanup");
const { hashToken } = require("../utils/securityTokens");
const transporter = require("../utils/nodemailerTransporter");

const reset = (token, password = "next-password-123") =>
  service.resetPassword({
    token,
    newPassword: password,
    confirmPassword: password,
  });
const privateUser = (id) =>
  User.findById(id).select(
    "+password +resetPasswordTokenHash +resetPasswordExpiresAt +tokenVersion"
  );

beforeAll(mongo.connect);
afterAll(mongo.disconnect);
afterEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await User.deleteMany({});
});

test("validity checks do not consume links; successful reset prevents replay", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await request(app).get(`/reset-password/${token}`);
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.expiresAt).toEqual(expect.any(String));
  }
  await reset(token);
  await expect(reset(token, "different-password")).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  const response = await request(app).get(`/reset-password/${token}`);
  expect(response.status).toBe(401);
  expect(response.body.code).toBe("RESET_LINK_INVALID");
  expect((await privateUser(user._id)).tokenVersion).toBe(1);
});

test("expired links are rejected and cleared when accessed", async () => {
  const user = await createUser();
  const token = await createResetToken(user, new Date(Date.now() - 1));
  await expect(reset(token)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  const saved = await privateUser(user._id);
  expect(saved.password).toBe(user.password);
  expect(saved.resetPasswordTokenHash).toBeUndefined();
  expect(saved.resetPasswordExpiresAt).toBeUndefined();
  expect(saved.tokenVersion).toBe(0);
});

test("only one concurrent reset can succeed", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  const realHash = bcrypt.hash;
  let release;
  const bothHashing = new Promise((resolve) => {
    release = resolve;
  });
  let count = 0;
  jest.spyOn(bcrypt, "hash").mockImplementation(async (...args) => {
    count += 1;
    if (count === 2) release();
    await bothHashing;
    return realHash(...args);
  });
  const results = await Promise.allSettled([
    reset(token, "parallel-password-one"),
    reset(token, "parallel-password-two"),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled")
  ).toHaveLength(1);
  expect(
    results.find((result) => result.status === "rejected").reason.code
  ).toBe("RESET_LINK_INVALID");
  expect((await privateUser(user._id)).tokenVersion).toBe(1);
  expect(transporter.sendMail).toHaveBeenCalledTimes(1);
});

test("expiry is checked again after password hashing", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  const realHash = bcrypt.hash;
  jest.spyOn(bcrypt, "hash").mockImplementationOnce(async (...args) => {
    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordExpiresAt: new Date(0) } }
    );
    return realHash(...args);
  });
  await expect(reset(token)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  expect((await privateUser(user._id)).password).toBe(user.password);
});

test("a newly requested link invalidates the previous link even in the same second", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  await service.forgotPassword(user.email);
  const replacement = transporter.sendMail.mock.calls[0][0].html.match(
    /reset-password\/([a-f0-9]{64})/
  )[1];
  expect(replacement).not.toBe(token);
  await expect(reset(token)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  await expect(
    service.validateResetPasswordLink(replacement)
  ).resolves.toHaveProperty("expiresAt");
});

test("a link replaced during password hashing cannot reset the password", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  const realHash = bcrypt.hash;
  let replacement;
  jest.spyOn(bcrypt, "hash").mockImplementationOnce(async (...args) => {
    replacement = await createResetToken(user);
    return realHash(...args);
  });
  await expect(reset(token)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  expect((await privateUser(user._id)).resetPasswordTokenHash).toBe(
    hashToken(replacement)
  );
});

test("a concurrent password change cannot be overwritten by reset", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  const realHash = bcrypt.hash;
  const changedPassword = await realHash("changed-elsewhere", 4);
  jest.spyOn(bcrypt, "hash").mockImplementationOnce(async (...args) => {
    await User.updateOne(
      { _id: user._id },
      { $set: { password: changedPassword } }
    );
    return realHash(...args);
  });
  await expect(reset(token)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  expect((await privateUser(user._id)).password).toBe(changedPassword);
});

test("normal password changes clear outstanding reset links", async () => {
  const user = await createUser();
  const token = await createResetToken(user);
  await service.updatePassword({
    userId: user._id,
    oldPassword: "12345678",
    newPassword: "changed-password",
  });
  await expect(reset(token)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
  const saved = await privateUser(user._id);
  expect(saved.resetPasswordTokenHash).toBeUndefined();
  expect(saved.resetPasswordExpiresAt).toBeUndefined();
});

test("reset revokes existing and legacy sessions; fresh login works", async () => {
  const user = await createUser();
  const { token: session } = await service.login({
    email: user.email,
    password: "12345678",
  });
  const legacySession = jwt.sign(
    { _id: user._id, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  expect(
    (await request(app).get("/profile").set("Cookie", `jwt=${legacySession}`))
      .status
  ).toBe(200);
  const token = await createResetToken(user);
  const response = await request(app).put(`/reset-password/${token}`).send({
    newPassword: "next-password-123",
    confirmPassword: "next-password-123",
  });
  expect(response.status).toBe(200);
  expect(response.headers["set-cookie"][0]).toContain("jwt=;");
  for (const cookie of [session, legacySession]) {
    expect(
      (await request(app).get("/profile").set("Cookie", `jwt=${cookie}`)).status
    ).toBe(401);
  }
  const { token: freshSession } = await service.login({
    email: user.email,
    password: "next-password-123",
  });
  expect(
    (await request(app).get("/profile").set("Cookie", `jwt=${freshSession}`))
      .status
  ).toBe(200);
});

test("API responses and explicitly selected documents omit private fields", async () => {
  const user = await createUser({
    emailChangeOldTokenHash: "private-email-token",
  });
  await User.collection.updateOne(
    { _id: user._id },
    { $set: { internalNote: "private field outside the current schema" } }
  );
  await createResetToken(user);
  const { token } = await service.login({
    email: user.email,
    password: "12345678",
  });
  const response = await request(app)
    .get("/profile")
    .set("Cookie", `jwt=${token}`);
  expect(response.status).toBe(200);
  const selected = await privateUser(user._id);
  for (const data of [response.body, selected.toJSON()]) {
    for (const field of [
      "password",
      "internalNote",
      "resetPasswordTokenHash",
      "resetPasswordExpiresAt",
      "tokenVersion",
      "emailChangeOldTokenHash",
      "__v",
    ]) {
      expect(data).not.toHaveProperty(field);
    }
  }
});

test("cleanup removes expired and incomplete reset records, preserving users and fresh links", async () => {
  const expired = await createUser();
  await createResetToken(expired, new Date(0));
  const fresh = await createUser({ email: "fresh@test.com" });
  const freshToken = await createResetToken(fresh);
  const incomplete = await createUser({
    email: "incomplete@test.com",
    resetPasswordTokenHash: "a".repeat(64),
  });
  await cleanupExpiredTokens();
  expect(await User.countDocuments()).toBe(3);
  expect(
    (await privateUser(expired._id)).resetPasswordTokenHash
  ).toBeUndefined();
  expect(
    (await privateUser(incomplete._id)).resetPasswordTokenHash
  ).toBeUndefined();
  expect((await privateUser(fresh._id)).resetPasswordTokenHash).toBe(
    hashToken(freshToken)
  );
});

test("signed session JWTs cannot be used as reset credentials", async () => {
  const user = await createUser();
  const sessionToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  await expect(reset(sessionToken)).rejects.toMatchObject({
    code: "RESET_LINK_INVALID",
  });
});
