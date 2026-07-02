const request = require("supertest");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");
const createUser = require("./helpers/createUser");
const expectAuthCookie = require("./helpers/expectAuthCookie");
const login = require("./helpers/login");
const createUpdateEmailToken = require("./helpers/createUpdateEmailToken");

const {
  SUCCESSFUL_LOGIN_MSG,
  WRONG_EMAIL_OR_PASSWORD_ERROR_MSG,
  SUCCESSFUL_LOGOUT_MSG,
  TOKEN_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  EMAIL_SENT_SUCCESSFULLY_MSG,
  SUCCESSFUL_EMAIL_UPDATE_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
  RESET_TOKEN_ERROR_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(mongo.disconnect);

describe("Authentication", () => {
  describe("POST /signup", () => {
    test("should reject public registration", async () => {
      const response = await request(app).post("/signup").send({
        name: "Alina",
        email: "alina@test.com",
        password: "12345678",
      });

      expect(response.status).toBe(403);
      expect(await User.countDocuments()).toBe(0);
      expect(response.body.message).toBe("User registration is disabled");
    });
  });

  describe("POST /signin", () => {
    test("should authenticate valid user", async () => {
      await createUser();

      const response = await request(app).post("/signin").send({
        email: "alina@test.com",
        password: "12345678",
      });

      expect(response.status).toBe(200);

      expect(response.headers["set-cookie"]).toBeDefined();
      const [cookie] = response.headers["set-cookie"];
      expectAuthCookie(cookie);

      expect(response.body.user.email).toBe("alina@test.com");
      expect(typeof response.body.user._id).toBe("string");
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.message).toBe(SUCCESSFUL_LOGIN_MSG);
      expect(response.body).not.toHaveProperty("token");
    });

    test("should reject wrong password", async () => {
      await createUser();

      const response = await request(app).post("/signin").send({
        email: "alina@test.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(WRONG_EMAIL_OR_PASSWORD_ERROR_MSG);
    });

    test("should return 401 for unknown user", async () => {
      const response = await request(app).post("/signin").send({
        email: "unknown@test.com",
        password: "12345678",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(WRONG_EMAIL_OR_PASSWORD_ERROR_MSG);
    });
  });

  describe("DELETE /signout", () => {
    test("should logout authenticated user", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .delete("/signout")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(SUCCESSFUL_LOGOUT_MSG);

      expect(response.headers["set-cookie"]).toBeDefined();

      const [logoutCookie] = response.headers["set-cookie"];

      expect(logoutCookie).toContain("jwt=");
      expect(logoutCookie).toContain("Expires=");
    });

    test("should reject logout without token", async () => {
      const response = await request(app).delete("/signout");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(TOKEN_ERROR_MSG);
    });
  });

  describe("GET /profile", () => {
    test("should return current user", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app).get("/profile").set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.email).toBe("alina@test.com");
      expect(response.body._id).toEqual(expect.any(String));
      expect(response.body).not.toHaveProperty("password");
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get("/profile");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(UNAUTHORIZED_ERROR_MSG);
    });
  });

  describe("PUT /profile/update-email", () => {
    test("should request email update", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .put("/profile/update-email")
        .set("Cookie", cookie)
        .send({
          newEmail: "new@test.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(EMAIL_SENT_SUCCESSFULLY_MSG);

      const user = await User.findOne({
        email: "alina@test.com",
      });

      expect(user.updateEmailLink).toEqual(expect.any(String));
    });

    test("should reject updating to the same email", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .put("/profile/update-email")
        .set("Cookie", cookie)
        .send({
          newEmail: "alina@test.com",
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(CONFLICT_UPDATE_EMAIL_ERROR_MSG);
    });

    test("should require authentication", async () => {
      const response = await request(app).put("/profile/update-email").send({
        newEmail: "new@test.com",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(UNAUTHORIZED_ERROR_MSG);
    });

    test("should reject invalid email", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .put("/profile/update-email")
        .set("Cookie", cookie)
        .send({
          newEmail: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("PATCH /profile/update-email/:token", () => {
    test("should reject invalid token", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .patch("/profile/update-email/invalid-token")
        .set("Cookie", cookie);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(RESET_TOKEN_ERROR_MSG);
    });

    test("should update email", async () => {
      const user = await createUser();

      const cookie = await login();

      const token = await createUpdateEmailToken(user, "new@test.com");

      const response = await request(app)
        .patch(`/profile/update-email/${token}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.message).toBe(SUCCESSFUL_EMAIL_UPDATE_MSG);

      expect(response.body.user.email).toBe("new@test.com");

      const saved = await User.findById(user._id);

      expect(saved.email).toBe("new@test.com");
      expect(saved.updateEmailLink).toBe("");
    });

    test("should reject mismatched token", async () => {
      const user = await createUser();

      const cookie = await login();

      const token = await createUpdateEmailToken(user, "new@test.com");

      user.updateEmailLink = "another-token";
      await user.save();

      const response = await request(app)
        .patch(`/profile/update-email/${token}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(RESET_TOKEN_ERROR_MSG);
    });

    test("should reject existing email from token", async () => {
      const user = await createUser();

      await createUser({
        email: "existing@test.com",
      });

      const cookie = await login();

      const token = await createUpdateEmailToken(user, "existing@test.com");

      const response = await request(app)
        .patch(`/profile/update-email/${token}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(CONFLICT_UPDATE_EMAIL_ERROR_MSG);
    });
  });
});
