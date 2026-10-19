jest.mock("../utils/nodemailerTransporter", () => ({
  sendMail: jest.fn().mockResolvedValue(),
}));

const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");
const SiteSettings = require("../models/siteSettings");
const createUser = require("./helpers/createUser");
const expectAuthCookie = require("./helpers/expectAuthCookie");
const login = require("./helpers/login");

const {
  SUCCESSFUL_LOGIN_MSG,
  WRONG_EMAIL_OR_PASSWORD_ERROR_MSG,
  SUCCESSFUL_LOGOUT_MSG,
  TOKEN_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  jest.clearAllMocks();
  await User.deleteMany({});
  await SiteSettings.deleteMany({});
});

afterAll(mongo.disconnect);

describe("Authentication", () => {
  describe("POST /signup", () => {
    test("should reject public registration by default", async () => {
      const response = await request(app).post("/signup").send({
        email: "alina@test.com",
        password: "12345678",
      });

      expect(response.status).toBe(403);
      expect(await User.countDocuments()).toBe(0);
      expect(response.body.message).toBe("Signup is currently disabled");
    });

    test("should register user when signup is enabled", async () => {
      await SiteSettings.create({
        _id: "site-settings",
        heroes: {
          main: null,
          gallery: null,
        },
        auth: {
          signupEnabled: true,
        },
      });

      const response = await request(app).post("/signup").send({
        email: "alina@test.com",
        password: "12345678",
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe("alina@test.com");
      expect(response.body.user).not.toHaveProperty("password");
      expect(await User.countDocuments()).toBe(1);
    });
  });

  describe("POST /signin", () => {
    test("should authenticate valid user", async () => {
      await createUser();

      const response = await request(app).post("/signin").send({
        email: "test@test.com",
        password: "12345678",
      });

      expect(response.status).toBe(200);

      expect(response.headers["set-cookie"]).toBeDefined();
      const [cookie] = response.headers["set-cookie"];
      expectAuthCookie(cookie);

      expect(response.body.user.email).toBe("test@test.com");
      expect(typeof response.body.user._id).toBe("string");
      expect(response.body.user.role).toBe("user");
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

      expect(response.body.email).toBe("test@test.com");
      expect(response.body._id).toEqual(expect.any(String));
      expect(response.body).not.toHaveProperty("password");
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get("/profile");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(UNAUTHORIZED_ERROR_MSG);
    });
  });
});
