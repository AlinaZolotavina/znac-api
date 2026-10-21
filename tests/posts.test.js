const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const app = require("../app");

const User = require("../models/user");
const Post = require("../models/post");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const createPost = require("./helpers/createPost");
const getUploadsDirectory = require("../utils/getUploadsDirectory");
const migratePostThemes = require("../scripts/migratePostThemes");

const {
  POST_NOT_FOUND_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  SUCCESSFUL_POST_DELETE_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
  await Promise.all([
    fs.rm(path.join(getUploadsDirectory(), "posts/post-test-update.jpg"), {
      force: true,
    }),
    fs.rm(
      path.join(
        getUploadsDirectory(),
        "posts/thumbnails/post-test-update-thumb.webp"
      ),
      { force: true }
    ),
    fs.rm(path.join(getUploadsDirectory(), "posts/post-test-delete.jpg"), {
      force: true,
    }),
    fs.rm(
      path.join(
        getUploadsDirectory(),
        "posts/thumbnails/post-test-delete-thumb.webp"
      ),
      { force: true }
    ),
  ]);
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
          theme: "Development",
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
          theme: "Development",
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

    test("should allow post title up to 70 characters and text up to 6000 characters", async () => {
      await createUser();

      const cookie = await login();
      const title = "a".repeat(70);
      const text = "b".repeat(6000);

      const response = await request(app)
        .post("/posts")
        .set("Cookie", cookie)
        .send({
          theme: "Development",
          icon: "рџ’»",
          title,
          hashtags: "node",
          text,
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(title);
      expect(response.body.text).toBe(text);
    });

    test("should reject post title and text over limits", async () => {
      await createUser();

      const cookie = await login();

      const response = await request(app)
        .post("/posts")
        .set("Cookie", cookie)
        .send({
          theme: "Development",
          icon: "рџ’»",
          title: "a".repeat(71),
          hashtags: "node",
          text: "b".repeat(6001),
        });

      expect(response.status).toBe(400);
      expect(await Post.countDocuments()).toBe(0);
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
        theme: "Development",
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

    test("should delete the old thumbnail when replacing an uploaded photo", async () => {
      const user = await createUser();

      const cookie = await login();
      const filename = "post-test-update.jpg";
      const filePath = path.join(getUploadsDirectory(), "posts", filename);
      const thumbnailPath = path.join(
        getUploadsDirectory(),
        "posts/thumbnails/post-test-update-thumb.webp"
      );

      await fs.writeFile(filePath, "photo");
      await fs.writeFile(thumbnailPath, "thumbnail");

      const post = await createPost(user._id, {
        photoFilename: filename,
        photoLink: undefined,
      });

      const response = await request(app)
        .patch(`/posts/${post._id}`)
        .set("Cookie", cookie)
        .send({
          newTheme: post.theme,
          newIcon: post.icon,
          newTitle: post.title,
          newPhotoLink: "https://example.com/new-photo.jpg",
          newHashtags: "node express",
          newText: post.text,
        });

      expect(response.status).toBe(200);
      await expect(fs.stat(filePath)).rejects.toThrow();
      await expect(fs.stat(thumbnailPath)).rejects.toThrow();
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

    test("should delete uploaded photo and thumbnail", async () => {
      const user = await createUser();

      const cookie = await login();
      const filename = "post-test-delete.jpg";
      const filePath = path.join(getUploadsDirectory(), "posts", filename);
      const thumbnailPath = path.join(
        getUploadsDirectory(),
        "posts/thumbnails/post-test-delete-thumb.webp"
      );

      await fs.writeFile(filePath, "photo");
      await fs.writeFile(thumbnailPath, "thumbnail");

      const post = await createPost(user._id, {
        photoFilename: filename,
        photoLink: undefined,
      });

      const response = await request(app)
        .delete(`/posts/${post._id}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      await expect(fs.stat(filePath)).rejects.toThrow();
      await expect(fs.stat(thumbnailPath)).rejects.toThrow();
    });
  });

  describe("Categories", () => {
    const themes = ["Development", "Design", "Travel", "Daily life"];
    const invalidThemes = [
      "Web development",
      "Web design",
      "Books",
      "Backend",
      "",
    ];
    const data = {
      theme: "Development",
      icon: "js",
      title: "An article",
      hashtags: "node express",
      text: "Post text",
    };
    const updateData = {
      newTheme: data.theme,
      newIcon: data.icon,
      newTitle: data.title,
      newHashtags: data.hashtags,
      newText: data.text,
    };

    let user;
    let cookie;

    beforeEach(async () => {
      user = await createUser();
      cookie = await login();
    });

    describe("API validation and filtering", () => {
      test.each(themes)("creates a post with %s", async (theme) => {
        const response = await request(app)
          .post("/posts")
          .set("Cookie", cookie)
          .send({ ...data, theme });

        expect(response.status).toBe(201);
        expect(response.body.theme).toBe(theme);
        expect((await Post.findById(response.body._id)).theme).toBe(theme);
      });

      test.each(invalidThemes)("rejects creation with %s", async (theme) => {
        const response = await request(app)
          .post("/posts")
          .set("Cookie", cookie)
          .send({ ...data, theme });

        expect(response.status).toBe(400);
        expect(await Post.countDocuments()).toBe(0);
      });

      test.each(themes)("updates a post to %s", async (newTheme) => {
        const post = await createPost(user._id);
        const response = await request(app)
          .patch(`/posts/${post._id}`)
          .set("Cookie", cookie)
          .send({ ...updateData, newTheme });

        expect(response.status).toBe(200);
        expect(response.body.theme).toBe(newTheme);
        expect((await Post.findById(post._id)).theme).toBe(newTheme);
      });

      test.each(invalidThemes)("rejects editing to %s", async (newTheme) => {
        const post = await createPost(user._id);
        const response = await request(app)
          .patch(`/posts/${post._id}`)
          .set("Cookie", cookie)
          .send({ ...updateData, newTheme });

        expect(response.status).toBe(400);
        expect((await Post.findById(post._id)).theme).toBe("Development");
      });

      test.each(themes)("filters and searches by %s", async (theme) => {
        await Promise.all(
          themes.map((postTheme) =>
            createPost(user._id, {
              theme: postTheme,
              title: "Matching article",
            })
          )
        );
        await createPost(user._id, { theme, title: "Other article" });

        const filtered = await request(app).get("/posts").query({ theme });
        expect(filtered.status).toBe(200);
        expect(filtered.body.total).toBe(2);
        expect(filtered.body.data.map((post) => post.theme)).toEqual([
          theme,
          theme,
        ]);

        const searched = await request(app)
          .get("/posts")
          .query({ search: theme });
        expect(searched.status).toBe(200);
        expect(searched.body.total).toBe(2);
        expect(searched.body.data.map((post) => post.theme)).toEqual([
          theme,
          theme,
        ]);

        const combined = await request(app)
          .get("/posts")
          .query({ theme, search: "Matching", page: 1, limit: 1 });
        expect(combined.status).toBe(200);
        expect(combined.body.total).toBe(1);
        expect(combined.body.data).toEqual([
          expect.objectContaining({ theme, title: "Matching article" }),
        ]);
      });

      test.each(["Web development", "Web design", "Books"])(
        "rejects filtering by %s",
        async (theme) => {
          const response = await request(app).get("/posts").query({ theme });
          expect(response.status).toBe(400);
        }
      );

      test("All still returns every category", async () => {
        await Promise.all(
          themes.map((theme) => createPost(user._id, { theme }))
        );
        const response = await request(app)
          .get("/posts")
          .query({ theme: "All" });
        expect(response.status).toBe(200);
        expect(response.body.total).toBe(4);
      });
    });

    describe("Migration", () => {
      test("renames every legacy post, preserves other fields, and is repeatable", async () => {
        const legacyThemes = [
          "Web development",
          "Web development",
          "Web design",
        ];
        // Insert raw records to represent data saved before the schema enum existed.
        const originals = [...legacyThemes, ...themes].map((theme) =>
          new Post({
            ...data,
            owner: user._id,
            theme,
            hashtags: ["node"],
          }).toObject()
        );
        await Post.collection.insertMany(originals);
        const before = await Post.collection
          .find({})
          .sort({ _id: 1 })
          .toArray();

        const preview = await migratePostThemes({ dryRun: true });
        expect(preview.map((result) => result.matchedCount)).toEqual([2, 1]);
        expect(
          await Post.collection.find({}).sort({ _id: 1 }).toArray()
        ).toEqual(before);

        const results = await migratePostThemes();
        expect(results.map((result) => result.modifiedCount)).toEqual([2, 1]);
        const renames = {
          "Web development": "Development",
          "Web design": "Design",
        };
        expect(
          await Post.collection.find({}).sort({ _id: 1 }).toArray()
        ).toEqual(
          before.map((post) => ({
            ...post,
            theme: renames[post.theme] || post.theme,
          }))
        );
        const rerun = await migratePostThemes();
        expect(rerun.map((result) => result.modifiedCount)).toEqual([0, 0]);
      });
    });
  });

  describe("External links", () => {
    const postData = {
      theme: "Development",
      icon: "link",
      title: "External article",
      hashtags: "node express",
      text: "Post text",
    };
    const updateData = {
      newTheme: postData.theme,
      newIcon: postData.icon,
      newTitle: postData.title,
      newHashtags: postData.hashtags,
      newText: postData.text,
    };
    const link = "https://example.com/article";
    const existingLink = {
      externalLink: link,
      externalLinkButtonText: "Read more",
    };
    const invalidFields = [
      { externalLink: "not-a-url" },
      { externalLink: "example.com/article" },
      { externalLink: "javascript:alert(1)" },
      { externalLink: "data:text/html,hello" },
      { externalLink: "file:///etc/passwd" },
      { externalLink: "ftp://example.com/file" },
      { externalLink: null },
      { externalLink: 123 },
      { externalLink: link, externalLinkButtonText: "a".repeat(41) },
      { externalLink: link, externalLinkButtonText: null },
    ];

    let user;
    let cookie;

    beforeEach(async () => {
      user = await createUser();
      cookie = await login();
    });

    // Check raw MongoDB data as well as responses so empty fields cannot be hidden
    // by serialization while remaining in storage.
    const expectLinkFields = (object, expected) => {
      ["externalLink", "externalLinkButtonText"].forEach((field) => {
        if (expected[field] === undefined) {
          expect(object).not.toHaveProperty(field);
        } else {
          expect(object[field]).toBe(expected[field]);
        }
      });
    };

    describe("POST /posts", () => {
      test.each([
        ["without a link", {}, {}],
        ["with only a link", { externalLink: link }, { externalLink: link }],
        [
          "with an HTTP link",
          { externalLink: "http://example.com/article" },
          { externalLink: "http://example.com/article" },
        ],
        [
          "with a local URL following existing project validation",
          { externalLink: "http://localhost/article" },
          { externalLink: "http://localhost/article" },
        ],
        [
          "with a private IP following existing project validation",
          { externalLink: "http://192.168.1.1/article" },
          { externalLink: "http://192.168.1.1/article" },
        ],
        ["with custom text", existingLink, existingLink],
        [
          "with trimmed custom text",
          { externalLink: link, externalLinkButtonText: "  Read more  " },
          existingLink,
        ],
        [
          "with 40 character custom text",
          { externalLink: link, externalLinkButtonText: "a".repeat(40) },
          { externalLink: link, externalLinkButtonText: "a".repeat(40) },
        ],
        [
          "with one character custom text",
          { externalLink: link, externalLinkButtonText: "a" },
          { externalLink: link, externalLinkButtonText: "a" },
        ],
        [
          "with empty fields",
          { externalLink: "", externalLinkButtonText: "" },
          {},
        ],
        [
          "with orphaned custom text",
          { externalLinkButtonText: "Read more" },
          {},
        ],
        [
          "with blank custom text",
          { externalLink: link, externalLinkButtonText: "   " },
          { externalLink: link },
        ],
      ])("creates a post %s", async (_name, fields, expected) => {
        const response = await request(app)
          .post("/posts")
          .set("Cookie", cookie)
          .send({ ...postData, ...fields });

        expect(response.status).toBe(201);
        expectLinkFields(response.body, expected);
        const saved = await Post.collection.findOne({ owner: user._id });
        expectLinkFields(saved, expected);
      });

      test.each(invalidFields)(
        "returns 400 for invalid fields %j",
        async (fields) => {
          const response = await request(app)
            .post("/posts")
            .set("Cookie", cookie)
            .send({ ...postData, ...fields });

          expect(response.status).toBe(400);
          expect(await Post.countDocuments()).toBe(0);
        }
      );
    });

    describe("PATCH /posts/:id", () => {
      test.each([
        [
          "adds a link and custom text",
          {},
          { newExternalLink: link, newExternalLinkButtonText: "Read more" },
          existingLink,
        ],
        [
          "adds a link without custom text",
          {},
          { newExternalLink: link },
          { externalLink: link },
        ],
        [
          "changes the link and custom text",
          existingLink,
          {
            newExternalLink: "http://example.org/new-article",
            newExternalLinkButtonText: "  Open article  ",
          },
          {
            externalLink: "http://example.org/new-article",
            externalLinkButtonText: "Open article",
          },
        ],
        ["clears the link and text", existingLink, { newExternalLink: "" }, {}],
        [
          "discards custom text when clearing the link",
          existingLink,
          { newExternalLink: "", newExternalLinkButtonText: "Orphaned text" },
          {},
        ],
        [
          "clears only the custom text",
          existingLink,
          { newExternalLinkButtonText: "" },
          { externalLink: link },
        ],
        [
          "clears whitespace-only custom text",
          existingLink,
          { newExternalLinkButtonText: "   " },
          { externalLink: link },
        ],
        [
          "changes only the custom text",
          existingLink,
          { newExternalLinkButtonText: "New label" },
          { externalLink: link, externalLinkButtonText: "New label" },
        ],
        [
          "preserves text when changing only the link",
          existingLink,
          { newExternalLink: "https://example.org/new" },
          {
            externalLink: "https://example.org/new",
            externalLinkButtonText: "Read more",
          },
        ],
        ["preserves omitted fields", existingLink, {}, existingLink],
        [
          "discards text without a link",
          {},
          { newExternalLinkButtonText: "Orphaned text" },
          {},
        ],
      ])("%s", async (_name, initial, fields, expected) => {
        const post = await createPost(user._id, initial);
        const response = await request(app)
          .patch(`/posts/${post._id}`)
          .set("Cookie", cookie)
          .send({ ...updateData, ...fields });

        expect(response.status).toBe(200);
        expectLinkFields(response.body, expected);
        const saved = await Post.collection.findOne({ _id: post._id });
        expectLinkFields(saved, expected);
      });

      test.each(invalidFields)(
        "returns 400 for invalid fields %j",
        async (fields) => {
          const post = await createPost(user._id, existingLink);
          const updateFields = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [
              `new${key[0].toUpperCase()}${key.slice(1)}`,
              value,
            ])
          );
          const response = await request(app)
            .patch(`/posts/${post._id}`)
            .set("Cookie", cookie)
            .send({ ...updateData, ...updateFields });

          expect(response.status).toBe(400);
          const saved = await Post.collection.findOne({ _id: post._id });
          expectLinkFields(saved, existingLink);
        }
      );
    });

    describe("GET /posts and /posts/:id", () => {
      test.each([
        ["legacy posts without link fields", {}],
        ["posts with a link and custom text", existingLink],
        ["posts with a link and default client text", { externalLink: link }],
      ])("returns %s", async (_name, fields) => {
        const post = await createPost(user._id, fields);
        const [single, list] = await Promise.all([
          request(app).get(`/posts/${post._id}`),
          request(app).get("/posts"),
        ]);

        expect(single.status).toBe(200);
        expect(list.status).toBe(200);
        expect(single.body._id).toBe(post._id.toString());
        expect(list.body.data).toHaveLength(1);
        expectLinkFields(single.body, fields);
        expectLinkFields(list.body.data[0], fields);
      });
    });
  });

  describe("Model validation", () => {
    const makePost = (fields = {}) =>
      new Post({
        owner: new mongoose.Types.ObjectId(),
        theme: "Development",
        icon: "link",
        title: "External article",
        text: "Post text",
        ...fields,
      });

    describe("Categories", () => {
      test.each(["Development", "Design", "Travel", "Daily life"])(
        "accepts %s when bypassing the API",
        async (theme) => {
          await expect(makePost({ theme }).validate()).resolves.toBeUndefined();
        }
      );

      test.each([
        "Web development",
        "Web design",
        "Books",
        "Backend",
        "",
        null,
      ])("rejects %s when bypassing the API", async (theme) => {
        await expect(makePost({ theme }).validate()).rejects.toThrow("theme");
      });
    });

    describe("External links", () => {
      test.each([
        "javascript:alert(1)",
        "data:text/html,hello",
        "file:///etc/passwd",
        "not a url",
      ])(
        "rejects invalid externalLink %s when bypassing the API",
        async (url) => {
          const post = makePost({ externalLink: url });

          await expect(post.validate()).rejects.toThrow("externalLink");
        }
      );

      test("enforces the same 40 character text limit as the API", async () => {
        const post = makePost({
          externalLink: "https://example.com/",
          externalLinkButtonText: "a".repeat(41),
        });

        await expect(post.validate()).rejects.toThrow("externalLinkButtonText");
      });

      test.each([undefined, null, ""])(
        "removes orphaned text when externalLink is %s",
        async (externalLink) => {
          const post = makePost({
            externalLink,
            externalLinkButtonText: "Read more",
          });
          await post.validate();

          expect(post.toObject()).not.toHaveProperty("externalLink");
          expect(post.toObject()).not.toHaveProperty("externalLinkButtonText");
        }
      );

      test.each([undefined, null, "", "   "])(
        "removes empty custom text %s while preserving the link",
        async (externalLinkButtonText) => {
          const post = makePost({
            externalLink: "https://example.com/",
            externalLinkButtonText,
          });
          await post.validate();

          expect(post.externalLink).toBe("https://example.com/");
          expect(post.toObject()).not.toHaveProperty("externalLinkButtonText");
        }
      );
    });
  });
});
