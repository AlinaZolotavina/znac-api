const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const mongoose = require("mongoose");
const app = require("../app");

const User = require("../models/user");
const Post = require("../models/post");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const createPost = require("./helpers/createPost");

const {
  POST_NOT_FOUND_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  SUCCESSFUL_POST_DELETE_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
});

afterAll(mongo.disconnect);

describe("Posts", () => {
  describe("GET /posts", () => {
    test("should return paginated posts", async () => {
      const user = await createUser();

      const cookie = await login();

      await createPost(user._id, { title: "First post" });
      await createPost(user._id, { title: "Second post" });

      const response = await request(app).get("/posts").set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          page: 1,
          total: 2,
          pages: 1,
          data: expect.any(Array),
        })
      );

      expect(response.body.data).toHaveLength(2);
      expect(response.body.limit).toBe(20);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          title: expect.any(String),
          theme: expect.any(String),
          icon: expect.any(String),
          hashtags: expect.any(Array),
          text: expect.any(String),
        })
      );
      expect(response.body.data[0].title).toBe("Second post");
      expect(response.body.data[1].title).toBe("First post");
    });

    test("should return a post", async () => {
      const user = await createUser();

      const cookie = await login();

      const post = await createPost(user._id);

      const response = await request(app)
        .get(`/posts/${post._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: post._id.toString(),
          title: post.title,
          theme: post.theme,
          icon: post.icon,
          hashtags: post.hashtags,
          text: post.text,
        })
      );
    });

    test("should return 404 for unknown post", async () => {
      await createUser();

      const cookie = await login();

      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/posts/${id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(POST_NOT_FOUND_ERROR_MSG);
    });
  });

  describe("POST /posts", () => {
    test("should create a post", async () => {
      const user = await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/posts")
        .set("Cookie", cookie)
        .send({
          theme: "Backend",
          icon: "💻",
          title: "Node.js",
          photoLink: "https://example.com/photo.jpg",
          hashtags: "node express",
          text: "Post text",
        });

      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          title: "Node.js",
          hashtags: ["node", "express"],
        })
      );

      expect(await Post.countDocuments()).toBe(1);

      const saved = await Post.findOne();

      expect(saved.owner.toString()).toBe(user._id.toString());
    });

    test("should normalize hashtags", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/posts")
        .set("Cookie", cookie)
        .send({
          theme: "Backend",
          icon: "💻",
          title: "Node.js",
          hashtags: "Node",
          text: "Post text",
        });

      expect(response.status).toBe(201);

      const saved = await Post.findOne();

      expect(response.body.hashtags).toEqual(["node"]);
      expect(saved.hashtags).toEqual(["node"]);
    });

    test("should reject invalid data", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/posts")
        .set("Cookie", cookie)
        .send({
          theme: "",
          icon: "",
          title: "A",
          hashtags: "",
          text: "",
        });

      expect(response.status).toBe(400);
      expect(await Post.countDocuments()).toBe(0);
    });

    test("should require authentication", async () => {
      const response = await request(app).post("/posts").send({
        theme: "Backend",
        icon: "💻",
        title: "Node.js",
        hashtags: "node",
        text: "Post text",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(UNAUTHORIZED_ERROR_MSG);

      expect(await Post.countDocuments()).toBe(0);
    });
  });

  describe("PATCH /posts/:id", () => {
    test("should update a post", async () => {
      const user = await createUser();

      const cookie = await login();

      const post = await createPost(user._id);

      const response = await request(app)
        .patch(`/posts/${post._id}`)
        .set("Cookie", cookie)
        .send({
          newTheme: "Travel",
          newIcon: "journey",
          newTitle: "New title",
          newPhotoLink: "https://example.com/new-photo.jpg",
          newHashtags: "travel europe",
          newText: "Updated text",
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: post._id.toString(),
          theme: "Travel",
          icon: "journey",
          title: "New title",
          photoLink: "https://example.com/new-photo.jpg",
          hashtags: ["travel", "europe"],
          text: "Updated text",
        })
      );

      const saved = await Post.findById(post._id);

      expect(saved.theme).toBe("Travel");
      expect(saved.icon).toBe("journey");
      expect(saved.title).toBe("New title");
      expect(saved.photoLink).toBe("https://example.com/new-photo.jpg");
      expect(saved.hashtags).toEqual(["travel", "europe"]);
      expect(saved.text).toBe("Updated text");
    });

    test("should remove photo when removePhoto is true", async () => {
      const user = await createUser();

      const cookie = await login();

      const post = await createPost(user._id);

      const response = await request(app)
        .patch(`/posts/${post._id}`)
        .set("Cookie", cookie)
        .send({
          newTheme: post.theme,
          newIcon: post.icon,
          newTitle: post.title,
          removePhoto: true,
          newHashtags: "node express",
          newText: post.text,
        });

      expect(response.status).toBe(200);

      expect(response.body).not.toHaveProperty("photoLink");

      const saved = await Post.findById(post._id);

      expect(saved.toObject()).not.toHaveProperty("photoLink");
    });

    test("should normalize hashtags when updating a post", async () => {
      const user = await createUser();

      const cookie = await login();

      const post = await createPost(user._id);

      const response = await request(app)
        .patch(`/posts/${post._id}`)
        .set("Cookie", cookie)
        .send({
          newTheme: post.theme,
          newIcon: post.icon,
          newTitle: post.title,
          newPhotoLink: post.photoLink,
          newHashtags: "Node",
          newText: post.text,
        });

      expect(response.status).toBe(200);

      expect(response.body.hashtags).toEqual(["node"]);

      const saved = await Post.findById(post._id);

      expect(saved.hashtags).toEqual(["node"]);
    });
  });

  describe("DELETE /posts/:id", () => {
    test("should delete a post", async () => {
      const user = await createUser();

      const cookie = await login();

      const post = await createPost(user._id);

      const response = await request(app)
        .delete(`/posts/${post._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(SUCCESSFUL_POST_DELETE_MSG);

      expect(await Post.countDocuments()).toBe(0);
    });

    test("should return 404 for unknown post", async () => {
      await createUser();

      const cookie = await login();

      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/posts/${id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(POST_NOT_FOUND_ERROR_MSG);
    });
  });
});
