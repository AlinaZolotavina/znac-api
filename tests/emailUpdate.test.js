jest.mock("../utils/nodemailerTransporter", () => ({
  sendMail: jest.fn().mockResolvedValue(),
}));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongo = require("./helpers/setupMongo");
const request = require("./helpers/requestWithOrigin");
const app = require("../app");
const User = require("../models/user");
const createUser = require("./helpers/createUser");
const createResetToken = require("./helpers/createResetToken");
const service = require("../services/userService");
const transporter = require("../utils/nodemailerTransporter");
const { hashToken, emailChangeFields } = require("../utils/securityTokens");
const { cleanupExpiredTokens } = require("../services/expiredTokenCleanup");

const args = (user, token) => ({
  userId: user._id,
  token,
  tokenVersion: user.tokenVersion ?? 0,
});
const inspect = (id) =>
  User.findById(id).select(
    "+password +tokenVersion +resetPasswordTokenHash +resetPasswordExpiresAt " +
      Object.keys(emailChangeFields)
        .map((field) => `+${field}`)
        .join(" ")
  );
async function startChange(user, overrides = {}) {
  await service.requestEmailUpdate({
    userId: user._id,
    newEmail: "new@test.com",
    currentPassword: "12345678",
    tokenVersion: user.tokenVersion ?? 0,
    ...overrides,
  });
  const tokens = transporter.sendMail.mock.calls
    .slice(-2)
    .map(([message]) => message.html.match(/update-email\/([a-f0-9]{64})/)[1]);
  return { current: tokens[0], new: tokens[1] };
}
async function session(user) {
  const { token } = await service.login({
    email: user.email,
    password: "12345678",
  });
  return `jwt=${token}`;
}
const invalid = { code: "EMAIL_CHANGE_LINK_INVALID" };

beforeAll(async () => {
  await mongo.connect();
  await User.init();
});
afterAll(mongo.disconnect);
afterEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await User.deleteMany({});
});

test("requires the current password and stores separate hashes, pending email and expiry", async () => {
  const user = await createUser();
  const tokens = await startChange(user, { newEmail: "  NEW@TEST.COM  " });
  const saved = await inspect(user._id);
  expect(saved.email).toBe(user.email);
  expect(saved.pendingEmail).toBe("new@test.com");
  expect(saved.emailChangeOldTokenHash).toBe(hashToken(tokens.current));
  expect(saved.emailChangeNewTokenHash).toBe(hashToken(tokens.new));
  expect(tokens.current).not.toBe(tokens.new);
  expect(saved.emailChangeExpiresAt.getTime()).toBeGreaterThan(
    Date.now() + 19 * 60 * 1000
  );
  expect((await User.findById(user._id)).pendingEmail).toBeUndefined();
  expect(transporter.sendMail).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ to: user.email })
  );
  expect(transporter.sendMail).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ to: "new@test.com" })
  );
  expect(JSON.stringify(saved)).not.toContain(saved.emailChangeOldTokenHash);
  expect(JSON.stringify(saved)).not.toContain("pendingEmail");
});

test("existing mixed-case email records still support signin, recovery and email change", async () => {
  const created = await createUser();
  await User.collection.updateOne(
    { _id: created._id },
    { $set: { email: "Existing@Example.com" } }
  );
  const user = await User.findById(created._id);
  await expect(
    service.login({ email: "existing@example.com", password: "12345678" })
  ).resolves.toHaveProperty("token");
  await service.forgotPassword("EXISTING@EXAMPLE.COM");
  expect((await inspect(user._id)).resetPasswordTokenHash).toEqual(
    expect.any(String)
  );
  const tokens = await startChange(user);
  await service.updateEmail(args(user, tokens.current));
  await expect(
    service.updateEmail(args(user, tokens.new))
  ).resolves.toHaveProperty("completed", true);
  expect((await inspect(user._id)).email).toBe("new@test.com");
});

test.each([undefined, "wrong-password"])(
  "rejects password %s without issuing tokens",
  async (currentPassword) => {
    const user = await createUser();
    await expect(startChange(user, { currentPassword })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect((await inspect(user._id)).pendingEmail).toBeUndefined();
    expect(transporter.sendMail).not.toHaveBeenCalled();
  }
);

test("requires authentication and password at the API boundary", async () => {
  const user = await createUser();
  expect(
    (
      await request(app)
        .put("/profile/update-email")
        .send({ newEmail: "new@test.com", currentPassword: "12345678" })
    ).status
  ).toBe(401);
  const cookie = await session(user);
  expect(
    (
      await request(app)
        .put("/profile/update-email")
        .set("Cookie", cookie)
        .send({ newEmail: "new@test.com" })
    ).status
  ).toBe(400);
  expect(
    (
      await request(app)
        .put("/profile/update-email")
        .set("Cookie", cookie)
        .send({ newEmail: "new@test.com", currentPassword: "12345678" })
    ).status
  ).toBe(200);
});

test("rejects the same address and an address already owned by another user", async () => {
  const user = await createUser();
  await expect(
    startChange(user, { newEmail: " TEST@TEST.COM " })
  ).rejects.toMatchObject({ statusCode: 409 });
  await createUser({ email: "NEW@TEST.COM" });
  await expect(startChange(user)).rejects.toMatchObject({ statusCode: 409 });
  expect(transporter.sendMail).not.toHaveBeenCalled();
});

test("validity checks do not consume either link and require the owner", async () => {
  const user = await createUser();
  const other = await createUser({ email: "other@test.com" });
  const tokens = await startChange(user);
  const cookie = await session(user);
  for (const token of [tokens.current, tokens.current, tokens.new]) {
    const response = await request(app)
      .get(`/profile/update-email/${token}`)
      .set("Cookie", cookie);
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.pendingEmail).toBe("new@test.com");
  }
  const otherCookie = await session(other);
  for (const method of ["get", "patch"]) {
    const response = await request(app)
      [method](`/profile/update-email/${tokens.current}`)
      .set("Cookie", otherCookie);
    expect(response.status).toBe(401);
    expect(response.body.code).toBe(invalid.code);
    expect(response.body.pendingEmail).toBeUndefined();
  }
  expect((await inspect(user._id)).emailChangeOldTokenHash).toBe(
    hashToken(tokens.current)
  );
});

test.each([
  ["current", "new"],
  ["new", "current"],
])(
  "confirms %s then %s and revokes sessions only at completion",
  async (first, second) => {
    const user = await createUser();
    const resetToken = await createResetToken(user);
    const tokens = await startChange(user);
    const cookie = await session(user);
    const firstResponse = await request(app)
      .patch(`/profile/update-email/${tokens[first]}`)
      .set("Cookie", cookie);
    expect(firstResponse.body.completed).toBe(false);
    expect(transporter.sendMail).toHaveBeenCalledTimes(2);
    expect(firstResponse.headers["set-cookie"]).toBeUndefined();
    expect((await inspect(user._id)).email).toBe(user.email);
    await expect(
      service.updateEmail(args(user, tokens[first]))
    ).rejects.toMatchObject(invalid);
    const finalResponse = await request(app)
      .patch(`/profile/update-email/${tokens[second]}`)
      .set("Cookie", cookie);
    expect(finalResponse.status).toBe(200);
    expect(finalResponse.body.completed).toBe(true);
    expect(transporter.sendMail).toHaveBeenCalledTimes(4);
    for (const to of [user.email, "new@test.com"]) {
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: "Your email address has been changed",
          html: expect.stringContaining("Your email address has been changed"),
        })
      );
    }
    await expect(
      service.updateEmail(args(user, tokens[second]))
    ).rejects.toMatchObject(invalid);
    expect(transporter.sendMail).toHaveBeenCalledTimes(4);
    expect(finalResponse.headers["set-cookie"][0]).toContain("jwt=;");
    const saved = await inspect(user._id);
    expect(saved.email).toBe("new@test.com");
    expect(saved.tokenVersion).toBe(1);
    for (const field of [
      ...Object.keys(emailChangeFields),
      "resetPasswordTokenHash",
      "resetPasswordExpiresAt",
    ])
      expect(saved[field]).toBeUndefined();
    expect(
      (await request(app).get("/profile").set("Cookie", cookie)).status
    ).toBe(401);
    await expect(
      service.validateResetPasswordLink(resetToken)
    ).rejects.toMatchObject({ code: "RESET_LINK_INVALID" });
    await expect(
      service.login({ email: "NEW@TEST.COM", password: "12345678" })
    ).resolves.toHaveProperty("token");
  }
);

function synchronizeWrites() {
  const realUpdate = User.findOneAndUpdate.bind(User);
  let release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  let count = 0;
  jest.spyOn(User, "findOneAndUpdate").mockImplementation((...params) => ({
    select: async (...selection) => {
      count += 1;
      if (count === 2) release();
      await barrier;
      return realUpdate(...params).select(...selection);
    },
  }));
}

test("simultaneous confirmations of different inboxes complete exactly once", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  synchronizeWrites();
  const results = await Promise.all([
    service.updateEmail(args(user, tokens.current)),
    service.updateEmail(args(user, tokens.new)),
  ]);
  expect(results.map((result) => result.completed).sort()).toEqual([
    false,
    true,
  ]);
  expect((await inspect(user._id)).email).toBe("new@test.com");
  expect((await inspect(user._id)).tokenVersion).toBe(1);
  expect(transporter.sendMail).toHaveBeenCalledTimes(4);
});

test("two concurrent uses of the same link consume it once", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  synchronizeWrites();
  const results = await Promise.allSettled([
    service.updateEmail(args(user, tokens.current)),
    service.updateEmail(args(user, tokens.current)),
  ]);
  expect(
    results.filter((result) => result.status === "fulfilled")
  ).toHaveLength(1);
  expect(
    results.find((result) => result.status === "rejected").reason.code
  ).toBe(invalid.code);
  expect((await inspect(user._id)).email).toBe(user.email);
});

test("notification delivery failure does not undo completion or prevent notifying the other inbox", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  const cookie = await session(user);
  await service.updateEmail(args(user, tokens.current));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  transporter.sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));

  const response = await request(app)
    .patch(`/profile/update-email/${tokens.new}`)
    .set("Cookie", cookie);

  expect(response.status).toBe(200);
  expect(response.body.completed).toBe(true);
  expect(response.headers["set-cookie"][0]).toContain("jwt=;");
  expect(transporter.sendMail).toHaveBeenCalledTimes(4);
  expect(transporter.sendMail).toHaveBeenLastCalledWith(
    expect.objectContaining({
      to: "new@test.com",
      subject: "Your email address has been changed",
    })
  );
  const saved = await inspect(user._id);
  expect(saved.email).toBe("new@test.com");
  expect(saved.pendingEmail).toBeUndefined();
  expect(saved.tokenVersion).toBe(1);
  expect(log).toHaveBeenCalledWith("Failed to send email change notification");
});

test("a replacement request invalidates both earlier links", async () => {
  const user = await createUser();
  const old = await startChange(user);
  const fresh = await startChange(user, { newEmail: "another@test.com" });
  for (const token of Object.values(old))
    await expect(service.updateEmail(args(user, token))).rejects.toMatchObject(
      invalid
    );
  await expect(
    service.validateEmailChangeLink(args(user, fresh.new))
  ).resolves.toHaveProperty("pendingEmail", "another@test.com");
});

test.each(["expired", "replaced", "passwordChanged"])(
  "a request %s before the atomic write cannot be confirmed",
  async (scenario) => {
    const user = await createUser();
    const tokens = await startChange(user);
    const realUpdate = User.findOneAndUpdate.bind(User);
    jest
      .spyOn(User, "findOneAndUpdate")
      .mockImplementationOnce((...params) => ({
        select: async (...selection) => {
          if (scenario === "expired")
            await User.updateOne(
              { _id: user._id },
              { $set: { emailChangeExpiresAt: new Date(0) } }
            );
          if (scenario === "replaced")
            await startChange(user, { newEmail: "replacement@test.com" });
          if (scenario === "passwordChanged")
            await service.updatePassword({
              userId: user._id,
              oldPassword: "12345678",
              newPassword: "changed-password",
            });
          return realUpdate(...params).select(...selection);
        },
      }));
    await expect(
      service.updateEmail(args(user, tokens.current))
    ).rejects.toMatchObject(invalid);
    expect((await inspect(user._id)).email).toBe(user.email);
    const saved = await inspect(user._id);
    expect(saved.pendingEmail).toBe(
      {
        expired: "new@test.com",
        replaced: "replacement@test.com",
        passwordChanged: undefined,
      }[scenario]
    );
  }
);

test("unique index races return 409 and preserve the current email", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  await service.updateEmail(args(user, tokens.current));
  await createUser({ email: "new@test.com" });
  const response = await request(app)
    .patch(`/profile/update-email/${tokens.new}`)
    .set("Cookie", await session(user));
  expect(response.status).toBe(409);
  const saved = await inspect(user._id);
  expect(saved.email).toBe(user.email);
  expect(saved.tokenVersion).toBe(0);
  expect(saved.emailChangeNewTokenHash).toBe(hashToken(tokens.new));
});

test("expired links are cleared on access, leaving the account intact", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  await User.updateOne(
    { _id: user._id },
    { $set: { emailChangeExpiresAt: new Date(0) } }
  );
  await expect(
    service.validateEmailChangeLink(args(user, tokens.current))
  ).rejects.toMatchObject(invalid);
  const saved = await inspect(user._id);
  for (const field of Object.keys(emailChangeFields))
    expect(saved[field]).toBeUndefined();
  expect(saved.email).toBe(user.email);
});

test("the shared cleanup removes expired email requests while preserving fresh requests", async () => {
  const expired = await createUser();
  await startChange(expired);
  await User.updateOne(
    { _id: expired._id },
    { $set: { emailChangeExpiresAt: new Date(0) } }
  );
  const fresh = await createUser({ email: "fresh@test.com" });
  const freshTokens = await startChange(fresh, {
    newEmail: "fresh-new@test.com",
  });
  await cleanupExpiredTokens();
  expect((await inspect(expired._id)).pendingEmail).toBeUndefined();
  expect((await inspect(fresh._id)).emailChangeNewTokenHash).toBe(
    hashToken(freshTokens.new)
  );
  expect(await User.countDocuments()).toBe(2);
});

test("password reset invalidates pending email changes and stale sessions cannot issue new requests", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  const reset = await createResetToken(user);
  await service.resetPassword({
    token: reset,
    newPassword: "changed-password",
    confirmPassword: "changed-password",
  });
  await expect(
    service.updateEmail(args(user, tokens.new))
  ).rejects.toMatchObject(invalid);
  expect((await inspect(user._id)).pendingEmail).toBeUndefined();
  await expect(
    startChange(user, { currentPassword: "changed-password" })
  ).rejects.toMatchObject({ statusCode: 401 });
});

test("SMTP failure clears only the request whose delivery failed", async () => {
  const user = await createUser();
  transporter.sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));
  await expect(startChange(user)).rejects.toThrow(
    "Could not send email change confirmations"
  );
  expect((await inspect(user._id)).pendingEmail).toBeUndefined();
  expect((await inspect(user._id)).email).toBe(user.email);
});

test("email and reset tokens cannot be used interchangeably; session JWTs are rejected", async () => {
  const user = await createUser();
  const tokens = await startChange(user);
  const reset = await createResetToken(user);
  await expect(
    service.validateEmailChangeLink(args(user, reset))
  ).rejects.toMatchObject(invalid);
  await expect(
    service.validateResetPasswordLink(tokens.new)
  ).rejects.toMatchObject({ code: "RESET_LINK_INVALID" });
  const signed = jwt.sign(
    { _id: user._id, newEmail: "new@test.com" },
    process.env.JWT_SECRET
  );
  await expect(service.updateEmail(args(user, signed))).rejects.toMatchObject(
    invalid
  );
  expect(
    await bcrypt.compare("12345678", (await inspect(user._id)).password)
  ).toBe(true);
});
