const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");
const Hashtag = require("../models/hashtag");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const createHashtag = require("./helpers/createHashtag");
const {
  CONFLICT_HASHTAG_ERROR_MSG,
  HASHTAG_MAX_LENGTH,
} = require("../utils/constants");

beforeAll(async () => {
  await mongo.connect();
  await Hashtag.init();
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Hashtag.deleteMany({})]);
});

afterAll(mongo.disconnect);

describe("Hashtags", () => {
  describe("GET /hashtags", () => {
    test("should return paginated hashtags", async () => {
      await createUser();

      const cookie = await login();

      await createHashtag({
        name: "first",
      });

      await createHashtag({
        name: "second",
      });

      const response = await request(app)
        .get("/hashtags")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          page: 1,
          total: 2,
          pages: 1,
          data: expect.any(Array),
        })
      );

      expect(response.body.limit).toBe(20);
      expect(response.body.data).toHaveLength(2);

      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
        })
      );

      expect(response.body.data[0].name).toBe("second");
      expect(response.body.data[1].name).toBe("first");
    });

    test("should support pagination", async () => {
      await createUser();

      const cookie = await login();

      await createHashtag({
        name: "first",
      });

      await createHashtag({
        name: "second",
      });

      const response = await request(app)
        .get("/hashtags?page=2&limit=1")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(1);
      expect(response.body.total).toBe(2);
      expect(response.body.pages).toBe(2);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("first");
    });
  });

  describe("POST /hashtags", () => {
    test("should create a public hashtag without authentication", async () => {
      const response = await request(app).post("/hashtags").send({
        newHashtag: "node",
      });

      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: "node",
        })
      );

      expect(await Hashtag.countDocuments()).toBe(1);

      const saved = await Hashtag.findOne();

      expect(saved.name).toBe("node");
    });

    test("should normalize hashtag name", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/hashtags")
        .set("Cookie", cookie)
        .send({
          newHashtag: "  Node  ",
        });

      expect(response.status).toBe(201);

      expect(response.body.name).toBe("node");

      const saved = await Hashtag.findOne();

      expect(saved.name).toBe("node");
    });

    test("should reject duplicate hashtag", async () => {
      await createHashtag({
        name: "node",
      });

      const response = await request(app).post("/hashtags").send({
        newHashtag: "  Node  ",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(CONFLICT_HASHTAG_ERROR_MSG);
      expect(await Hashtag.countDocuments()).toBe(1);
    });

    test.each([
      ["empty hashtag", "   "],
      ["too short hashtag", "n"],
      ["too long hashtag", "a".repeat(HASHTAG_MAX_LENGTH + 1)],
    ])("should reject %s", async (_caseName, newHashtag) => {
      const response = await request(app).post("/hashtags").send({
        newHashtag,
      });

      expect(response.status).toBe(400);
      expect(await Hashtag.countDocuments()).toBe(0);
    });

    test("should reject invalid hashtag", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/hashtags")
        .set("Cookie", cookie)
        .send({
          newHashtag: "node-js",
        });

      expect(response.status).toBe(400);

      expect(await Hashtag.countDocuments()).toBe(0);
    });

    test("should reject multiple fields in one request", async () => {
      const response = await request(app).post("/hashtags").send({
        newHashtag: "node",
        anotherHashtag: "react",
      });

      expect(response.status).toBe(400);
      expect(await Hashtag.countDocuments()).toBe(0);
    });
  });

  describe("PATCH /hashtags", () => {
    test("should update hashtag timestamp", async () => {
      await createUser();

      const cookie = await login();

      const hashtag = await createHashtag({
        name: "node",
      });

      const oldDate = hashtag.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request(app)
        .patch("/hashtags")
        .set("Cookie", cookie)
        .send({
          hashtagName: "node",
        });

      expect(response.status).toBe(200);

      expect(new Date(response.body.createdAt).getTime()).toBeGreaterThan(
        new Date(oldDate).getTime()
      );

      const updated = await Hashtag.findById(hashtag._id);

      expect(updated.createdAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    test("should normalize hashtag name before update", async () => {
      await createUser();

      const cookie = await login();

      await createHashtag({
        name: "node",
      });

      const response = await request(app)
        .patch("/hashtags")
        .set("Cookie", cookie)
        .send({
          hashtagName: "  Node  ",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("node");
    });

    test("should return 404 for unknown hashtag", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .patch("/hashtags")
        .set("Cookie", cookie)
        .send({
          hashtagName: "unknown",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Hashtag not found");
    });

    test("should reject invalid hashtag", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .patch("/hashtags")
        .set("Cookie", cookie)
        .send({
          hashtagName: "node-js",
        });

      expect(response.status).toBe(400);
    });

    test("should reject empty hashtag after trim", async () => {
      const response = await request(app).patch("/hashtags").send({
        hashtagName: "   ",
      });

      expect(response.status).toBe(400);
    });

    test("should reject multiple fields in one update request", async () => {
      const response = await request(app).patch("/hashtags").send({
        hashtagName: "node",
        anotherHashtag: "react",
      });

      expect(response.status).toBe(400);
    });
  });
});
