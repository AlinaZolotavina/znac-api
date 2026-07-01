require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const User = require("../models/user");
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

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

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
});
