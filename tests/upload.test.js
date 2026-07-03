const fs = require("fs/promises");
const path = require("path");
const request = require("supertest");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");

const { NO_PHOTO_TO_UPLOAD_ERROR_MSG } = require("../utils/constants");

const fixtures = path.join(__dirname, "fixtures");
const uploadsDir = path.join(__dirname, "..", "uploads", "gallery");

beforeAll(mongo.connect);

afterEach(async () => {
  await User.deleteMany({});

  const files = (await fs.readdir(uploadsDir)).filter(
    (file) => file !== ".gitkeep"
  );

  await Promise.all(
    files.map((file) => fs.unlink(path.join(uploadsDir, file)))
  );
});

afterAll(mongo.disconnect);

describe("Upload", () => {
  describe("POST /public", () => {
    test("should upload a single image", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .attach("photos", path.join(fixtures, "image.jpg"));

      expect(response.status).toBe(201);

      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe("Files uploaded successfully");

      expect(response.body.data).toHaveLength(1);

      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          filename: expect.stringMatching(/\.jpg$/),
          size: expect.any(Number),
          url: expect.stringContaining("/uploads/gallery/"),
        })
      );

      const uploaded = (await fs.readdir(uploadsDir)).filter(
        (file) => file !== ".gitkeep"
      );

      expect(uploaded).toHaveLength(1);
      expect(uploaded[0]).toMatch(/\.jpg$/);
    });

    test("should upload multiple images", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .attach("photos", path.join(fixtures, "image.jpg"))
        .attach("photos", path.join(fixtures, "image.webp"));

      expect(response.status).toBe(201);

      expect(response.body.data).toHaveLength(2);

      const uploaded = (await fs.readdir(uploadsDir)).filter(
        (file) => file !== ".gitkeep"
      );

      expect(uploaded).toHaveLength(2);
      expect(uploaded.some((file) => file.endsWith(".jpg"))).toBe(true);
      expect(uploaded.some((file) => file.endsWith(".webp"))).toBe(true);
    });

    test("should reject invalid file content", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .attach("photos", path.join(fixtures, "fake.jpg"));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid file content: fake.jpg");

      const uploaded = (await fs.readdir(uploadsDir)).filter(
        (file) => file !== ".gitkeep"
      );

      expect(uploaded).toHaveLength(0);
    });

    test("should reject unsupported file extension", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .attach("photos", path.join(fixtures, "test.gif"));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Unsupported file type: test.gif");

      const uploaded = (await fs.readdir(uploadsDir)).filter(
        (file) => file !== ".gitkeep"
      );

      expect(uploaded).toHaveLength(0);
    });

    test("should reject request without files", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .field("dummy", "value");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(NO_PHOTO_TO_UPLOAD_ERROR_MSG);
    });
  });
});
