const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");
const Post = require("../models/post");
const Project = require("../models/project");
const Photo = require("../models/photo");

const createTwoUsers = require("./helpers/createTwoUsers");
const loginAs = require("./helpers/loginAs");

const {
  POST_NOT_FOUND_ERROR_MSG,
  PHOTO_NOT_FOUND_ERROR_MSG,
  PROJECT_NOT_FOUND_ERROR_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Project.deleteMany({}),
    Photo.deleteMany({}),
  ]);
});

afterAll(mongo.disconnect);

describe("Permissions", () => {
  describe("Posts", () => {
    test("should not edit another user's post", async () => {
      const { owner, stranger } = await createTwoUsers();

      const post = await Post.create({
        owner: owner._id,
        theme: "Backend",
        icon: "💻",
        title: "Old title",
        photoLink: "https://example.com/photo.jpg",
        hashtags: ["node"],
        text: "Old text",
      });

      const cookie = await loginAs(stranger.email);

      const response = await request(app)
        .patch(`/posts/${post._id}`)
        .set("Cookie", cookie)
        .send({
          newTheme: "Frontend",
          newIcon: "🎨",
          newTitle: "New title",
          newHashtags: "react",
          newText: "Changed text",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(POST_NOT_FOUND_ERROR_MSG);

      const saved = await Post.findById(post._id);

      expect(saved.theme).toBe("Backend");
      expect(saved.icon).toBe("💻");
      expect(saved.title).toBe("Old title");
      expect(saved.hashtags).toEqual(["node"]);
      expect(saved.text).toBe("Old text");
      expect(saved.photoLink).toBe("https://example.com/photo.jpg");
      expect(saved.owner.toString()).toBe(owner._id.toString());
    });

    test("should not delete another user's post", async () => {
      const { owner, stranger } = await createTwoUsers();

      const post = await Post.create({
        owner: owner._id,
        theme: "Backend",
        icon: "💻",
        title: "Post",
        hashtags: ["node"],
        text: "text",
      });

      const cookie = await loginAs(stranger.email);

      const response = await request(app)
        .delete(`/posts/${post._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(POST_NOT_FOUND_ERROR_MSG);

      expect(await Post.countDocuments()).toBe(1);

      const saved = await Post.findById(post._id);

      expect(saved.owner.toString()).toBe(owner._id.toString());
    });
  });

  describe("Projects", () => {
    test("should not edit another user's project", async () => {
      const { owner, stranger } = await createTwoUsers();

      const project = await Project.create({
        owner: owner._id,
        title: "Old title",
        hashtags: ["react"],
        text: "Old text",
        link: "https://example.com",
      });

      const cookie = await loginAs(stranger.email);

      const response = await request(app)
        .patch(`/projects/${project._id}`)
        .set("Cookie", cookie)
        .send({
          newTitle: "New title",
          newHashtags: "node",
          newText: "Changed",
          newLink: "https://google.com",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(PROJECT_NOT_FOUND_ERROR_MSG);

      const saved = await Project.findById(project._id);

      expect(saved.title).toBe("Old title");
      expect(saved.hashtags).toEqual(["react"]);
      expect(saved.text).toBe("Old text");
      expect(saved.link).toBe("https://example.com");
      expect(saved.owner.toString()).toBe(owner._id.toString());
    });

    test("should not delete another user's project", async () => {
      const { owner, stranger } = await createTwoUsers();

      const project = await Project.create({
        owner: owner._id,
        title: "Project",
        hashtags: ["react"],
        text: "Project description",
        link: "https://example.com",
      });

      const cookie = await loginAs(stranger.email);

      const response = await request(app)
        .delete(`/projects/${project._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(PROJECT_NOT_FOUND_ERROR_MSG);

      expect(await Project.countDocuments()).toBe(1);

      const saved = await Project.findById(project._id);

      expect(saved.owner.toString()).toBe(owner._id.toString());
    });
  });

  describe("Photos", () => {
    test("should not edit another user's photo hashtags", async () => {
      const { owner, stranger } = await createTwoUsers();

      const photo = await Photo.create({
        owner: owner._id,
        link: "https://example.com/photo.jpg",
        hashtags: ["nature"],
        views: 0,
      });

      const cookie = await loginAs(stranger.email);

      const response = await request(app)
        .patch(`/photos/${photo._id}/hashtags`)
        .set("Cookie", cookie)
        .send({
          newHashtags: "winter snow",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(PHOTO_NOT_FOUND_ERROR_MSG);

      const saved = await Photo.findById(photo._id);

      expect(saved.hashtags).toEqual(["nature"]);
      expect(saved.owner.toString()).toBe(owner._id.toString());
    });

    test("should not delete another user's photo", async () => {
      const { owner, stranger } = await createTwoUsers();

      const photo = await Photo.create({
        owner: owner._id,
        link: "https://example.com/photo.jpg",
        hashtags: ["nature"],
        views: 0,
      });

      const cookie = await loginAs(stranger.email);

      const response = await request(app)
        .delete(`/photos/${photo._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(PHOTO_NOT_FOUND_ERROR_MSG);

      expect(await Photo.countDocuments()).toBe(1);

      const saved = await Photo.findById(photo._id);

      expect(saved.owner.toString()).toBe(owner._id.toString());
    });
  });
});
