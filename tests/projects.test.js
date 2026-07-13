const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const mongoose = require("mongoose");
const app = require("../app");

const User = require("../models/user");
const Project = require("../models/project");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const createProject = require("./helpers/createProject");

const {
  PROJECT_NOT_FOUND_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  SUCCESSFUL_PROJECT_DELETE_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({})]);
});

afterAll(mongo.disconnect);

describe("Projects", () => {
  describe("GET /projects", () => {
    test("should return paginated projects", async () => {
      const user = await createUser();

      const cookie = await login();

      await createProject(user._id, { title: "First project" });
      await createProject(user._id, { title: "Second project" });

      const response = await request(app)
        .get("/projects")
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
          title: expect.any(String),
          hashtags: expect.any(Array),
          text: expect.any(String),
          link: expect.any(String),
        })
      );

      expect(response.body.data[0].title).toBe("Second project");
      expect(response.body.data[1].title).toBe("First project");
    });

    test("should support pagination", async () => {
      const user = await createUser();

      const cookie = await login();

      await createProject(user._id, { title: "First" });
      await createProject(user._id, { title: "Second" });

      const response = await request(app)
        .get("/projects?page=2&limit=1")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("First");
    });

    test("should filter projects by hashtag", async () => {
      const user = await createUser();

      const cookie = await login();

      await createProject(user._id, {
        hashtags: ["node", "express"],
      });

      await createProject(user._id, {
        hashtags: ["react"],
      });

      const response = await request(app)
        .get("/projects?hashtag=node")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].hashtags).toContain("node");
    });

    test("should find legacy string hashtags", async () => {
      const user = await createUser();

      const cookie = await login();

      await Project.collection.insertOne({
        owner: user._id,
        title: "Legacy",
        hashtags: "node express",
        text: "Old project",
        link: "https://github.com/test/project",
        createdAt: new Date(),
      });

      const response = await request(app)
        .get("/projects?hashtag=node")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    test("should return popular hashtags", async () => {
      const user = await createUser();

      const cookie = await login();

      await createProject(user._id, {
        hashtags: ["node", "express"],
      });

      await createProject(user._id, {
        hashtags: ["node"],
      });

      await createProject(user._id, {
        hashtags: ["react"],
      });

      const response = await request(app)
        .get("/projecthashtags")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(["node", "express", "react"]);
    });
  });

  describe("POST /projects", () => {
    test("should create a project", async () => {
      const user = await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/projects")
        .set("Cookie", cookie)
        .send({
          title: "Portfolio",
          hashtags: "node express",
          text: "Project description",
          link: "https://github.com/test/project",
        });

      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          title: "Portfolio",
          hashtags: ["node", "express"],
        })
      );

      expect(await Project.countDocuments()).toBe(1);

      const saved = await Project.findOne();

      expect(saved.owner.toString()).toBe(user._id.toString());
    });

    test("should normalize hashtags", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/projects")
        .set("Cookie", cookie)
        .send({
          title: "Portfolio",
          hashtags: "Node",
          text: "Project description",
          link: "https://github.com/test/project",
        });

      expect(response.status).toBe(201);

      expect(response.body.hashtags).toEqual(["node"]);

      const saved = await Project.findOne();

      expect(saved.hashtags).toEqual(["node"]);
    });

    test("should reject invalid data", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/projects")
        .set("Cookie", cookie)
        .send({
          title: "",
          hashtags: "",
          text: "",
          link: "invalid",
        });

      expect(response.status).toBe(400);
      expect(await Project.countDocuments()).toBe(0);
    });

    test("should require authentication", async () => {
      const response = await request(app).post("/projects").send({
        title: "Portfolio",
        hashtags: "node",
        text: "Project description",
        link: "https://github.com/test/project",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(UNAUTHORIZED_ERROR_MSG);

      expect(await Project.countDocuments()).toBe(0);
    });
  });

  describe("PATCH /projects/:projectId", () => {
    test("should update a project", async () => {
      const user = await createUser();

      const cookie = await login();

      const project = await createProject(user._id);

      const response = await request(app)
        .patch(`/projects/${project._id}`)
        .set("Cookie", cookie)
        .send({
          newTitle: "Updated project",
          newHashtags: "travel europe",
          newText: "Updated text",
          newLink: "https://example.com/project",
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          title: "Updated project",
          hashtags: ["travel", "europe"],
        })
      );

      const saved = await Project.findById(project._id);

      expect(saved.title).toBe("Updated project");
      expect(saved.hashtags).toEqual(["travel", "europe"]);
    });

    test("should normalize hashtags when updating a project", async () => {
      const user = await createUser();

      const cookie = await login();

      const project = await createProject(user._id);

      const response = await request(app)
        .patch(`/projects/${project._id}`)
        .set("Cookie", cookie)
        .send({
          newTitle: project.title,
          newHashtags: "Node",
          newText: project.text,
          newLink: project.link,
        });

      expect(response.status).toBe(200);

      expect(response.body.hashtags).toEqual(["node"]);

      const saved = await Project.findById(project._id);

      expect(saved.hashtags).toEqual(["node"]);
    });
  });

  describe("DELETE /projects/:projectId", () => {
    test("should delete a project", async () => {
      const user = await createUser();

      const cookie = await login();

      const project = await createProject(user._id);

      const response = await request(app)
        .delete(`/projects/${project._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(SUCCESSFUL_PROJECT_DELETE_MSG);

      expect(await Project.countDocuments()).toBe(0);
    });

    test("should return 404 for unknown project", async () => {
      await createUser();

      const cookie = await login();

      const id = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/projects/${id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(PROJECT_NOT_FOUND_ERROR_MSG);
    });
  });
});
