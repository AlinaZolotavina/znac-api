const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");
const Hashtag = require("../models/hashtag");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const createHashtag = require("./helpers/createHashtag");

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
});
