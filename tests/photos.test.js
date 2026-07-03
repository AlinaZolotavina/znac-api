const request = require("supertest");
const mongo = require("./helpers/setupMongo");
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");

const app = require("../app");

const User = require("../models/user");
const Photo = require("../models/photo");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const createPhoto = require("./helpers/createPhoto");

const {
  PHOTO_NOT_FOUND_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  SUCCESSFUL_PHOTO_DELETE_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Photo.deleteMany({})]);
});

afterAll(mongo.disconnect);

describe("Photos", () => {
  describe("GET /photos", () => {
    test("should return paginated photos", async () => {
      const user = await createUser();

      const cookie = await login();

      await createPhoto(user._id, {
        link: "https://example.com/first.jpg",
      });

      await createPhoto(user._id, {
        link: "https://example.com/second.jpg",
      });

      const response = await request(app).get("/photos").set("Cookie", cookie);

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
          link: expect.any(String),
          hashtags: expect.any(Array),
          views: expect.any(Number),
        })
      );

      expect(response.body.data[0].link).toBe("https://example.com/second.jpg");

      expect(response.body.data[1].link).toBe("https://example.com/first.jpg");
    });

    test("should support pagination", async () => {
      const user = await createUser();

      const cookie = await login();

      await createPhoto(user._id, {
        link: "https://example.com/first.jpg",
      });

      await createPhoto(user._id, {
        link: "https://example.com/second.jpg",
      });

      const response = await request(app)
        .get("/photos?page=2&limit=1")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.page).toBe(2);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].link).toBe("https://example.com/first.jpg");
    });
  });

  describe("POST /photos/found", () => {
    test("should find photos by hashtag", async () => {
      const user = await createUser();

      const cookie = await login();

      await createPhoto(user._id, {
        hashtags: ["node", "express"],
      });

      await createPhoto(user._id, {
        hashtags: ["react"],
      });

      const response = await request(app)
        .post("/photos/found")
        .set("Cookie", cookie)
        .send({
          keyWord: "node",
        });

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].hashtags).toContain("node");
    });

    test("should support legacy string hashtags", async () => {
      const user = await createUser();

      const cookie = await login();

      await Photo.collection.insertOne({
        owner: user._id,
        link: "https://example.com/photo.jpg",
        hashtags: "node express",
        views: 0,
        createdAt: new Date(),
      });

      const response = await request(app)
        .post("/photos/found")
        .set("Cookie", cookie)
        .send({
          keyWord: "node",
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("POST /photos", () => {
    test("should create a photo", async () => {
      const user = await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/photos")
        .set("Cookie", cookie)
        .send({
          link: "https://example.com/photo.jpg",
          hashtags: "node express",
          views: 0,
        });

      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          link: "https://example.com/photo.jpg",
          hashtags: ["node", "express"],
          views: 0,
        })
      );

      const saved = await Photo.findOne();

      expect(saved.owner.toString()).toBe(user._id.toString());

      expect(await Photo.countDocuments()).toBe(1);
    });

    test("should normalize hashtags", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/photos")
        .set("Cookie", cookie)
        .send({
          link: "https://example.com/photo.jpg",
          hashtags: "Node",
          views: 0,
        });

      expect(response.status).toBe(201);

      expect(response.body.hashtags).toEqual(["node"]);

      const saved = await Photo.findOne();

      expect(saved.hashtags).toEqual(["node"]);
    });

    test("should reject invalid data", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/photos")
        .set("Cookie", cookie)
        .send({
          link: "invalid-url",
          hashtags: "",
          views: "abc",
        });

      expect(response.status).toBe(400);

      expect(await Photo.countDocuments()).toBe(0);
    });

    test("should require authentication", async () => {
      const response = await request(app).post("/photos").send({
        link: "https://example.com/photo.jpg",
        hashtags: "node",
        views: 0,
      });

      expect(response.status).toBe(401);

      expect(response.body.message).toBe(UNAUTHORIZED_ERROR_MSG);

      expect(await Photo.countDocuments()).toBe(0);
    });
  });

  describe("PATCH /photos/:photoId/hashtags", () => {
    test("should update photo hashtags", async () => {
      const user = await createUser();

      const cookie = await login();

      const photo = await createPhoto(user._id);

      const response = await request(app)
        .patch(`/photos/${photo._id}/hashtags`)
        .set("Cookie", cookie)
        .send({
          newHashtags: "travel europe",
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: photo._id.toString(),
          hashtags: ["travel", "europe"],
        })
      );

      const saved = await Photo.findById(photo._id);

      expect(saved.hashtags).toEqual(["travel", "europe"]);
    });

    test("should normalize hashtags", async () => {
      const user = await createUser();

      const cookie = await login();

      const photo = await createPhoto(user._id);

      const response = await request(app)
        .patch(`/photos/${photo._id}/hashtags`)
        .set("Cookie", cookie)
        .send({
          newHashtags: "Node",
        });

      expect(response.status).toBe(200);

      expect(response.body.hashtags).toEqual(["node"]);

      const saved = await Photo.findById(photo._id);

      expect(saved.hashtags).toEqual(["node"]);
    });
  });

  describe("PUT /photos/:photoId/views", () => {
    test("should increase photo views", async () => {
      const user = await createUser();

      const cookie = await login();

      const photo = await createPhoto(user._id, {
        views: 10,
      });

      const response = await request(app)
        .put(`/photos/${photo._id}/views`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.views).toBe(11);

      const saved = await Photo.findById(photo._id);

      expect(saved.views).toBe(11);
    });

    test("should return 404 for unknown photo", async () => {
      await createUser();

      const cookie = await login();

      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/photos/${id}/views`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(PHOTO_NOT_FOUND_ERROR_MSG);
    });
  });

  describe("DELETE /photos/:photoId", () => {
    test("should delete a photo", async () => {
      const user = await createUser();

      const cookie = await login();

      const photo = await createPhoto(user._id);

      const response = await request(app)
        .delete(`/photos/${photo._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.message).toBe(SUCCESSFUL_PHOTO_DELETE_MSG);

      expect(await Photo.countDocuments()).toBe(0);
    });

    test("should return 404 for unknown photo", async () => {
      await createUser();

      const cookie = await login();

      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/photos/${id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);

      expect(response.body.message).toBe(PHOTO_NOT_FOUND_ERROR_MSG);
    });

    test("should delete uploaded file from public", async () => {
      const user = await createUser();

      const cookie = await login();

      const fileName = "photo-test-delete.jpg";

      const filePath = path.join(__dirname, "../uploads/gallery", fileName);

      await fs.writeFile(filePath, "test");

      const photo = await createPhoto(user._id, {
        filename: fileName,
      });

      await expect(fs.stat(filePath)).resolves.toBeDefined();

      const response = await request(app)
        .delete(`/photos/${photo._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      await expect(fs.stat(filePath)).rejects.toThrow();
    });
  });
});
