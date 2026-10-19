const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");
const User = require("../models/user");
const Post = require("../models/post");
const createUser = require("./helpers/createUser");
const createPost = require("./helpers/createPost");
const login = require("./helpers/login");

const postData = {
  theme: "Backend",
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

beforeAll(mongo.connect);
beforeEach(async () => {
  user = await createUser();
  cookie = await login();
});
afterEach(async () => {
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
});
afterAll(mongo.disconnect);

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

describe("Post external links", () => {
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
