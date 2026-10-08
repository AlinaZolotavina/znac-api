const fs = require("fs/promises");
const path = require("path");
const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");

const createUser = require("./helpers/createUser");
const login = require("./helpers/login");

const { NO_PHOTO_TO_UPLOAD_ERROR_MSG } = require("../utils/constants");

const fixtures = path.join(__dirname, "fixtures");
const uploadsDir = path.join(process.env.UPLOADS_DIR, "gallery");
const thumbnailsDir = path.join(uploadsDir, "thumbnails");
const postUploadsDir = path.join(process.env.UPLOADS_DIR, "posts");
const postThumbnailsDir = path.join(postUploadsDir, "thumbnails");
const heroUploadsDir = path.join(process.env.UPLOADS_DIR, "heroes");
const oversizedFilePath = path.join(
  process.env.UPLOADS_DIR,
  "oversized-image.jpg"
);
const OVERSIZED_FILE_SIZE = 30 * 1024 * 1024 + 1;

const getUploadedFiles = async (directory) =>
  (await fs.readdir(directory)).filter((file) => file !== ".gitkeep");

const removeUploadedFile = (directory, file) =>
  fs.rm(path.join(directory, file), {
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });

const cleanUploads = async () => {
  const directories = [
    { directory: uploadsDir, exclude: "thumbnails" },
    { directory: thumbnailsDir },
    { directory: postUploadsDir, exclude: "thumbnails" },
    { directory: postThumbnailsDir },
    { directory: heroUploadsDir },
  ];
  const files = await Promise.all(
    directories.map(async ({ directory, exclude }) => ({
      directory,
      files: (await getUploadedFiles(directory)).filter(
        (file) => file !== exclude
      ),
    }))
  );

  await Promise.all(
    files.flatMap(({ directory, files: directoryFiles }) =>
      directoryFiles.map((file) => removeUploadedFile(directory, file))
    )
  );
};

const removeOversizedFixture = () =>
  fs.rm(oversizedFilePath, {
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });

beforeAll(mongo.connect);

beforeEach(cleanUploads);

afterEach(async () => {
  await User.deleteMany({});
  await cleanUploads();
  await removeOversizedFixture();
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
          thumbnail: expect.stringContaining("/uploads/gallery/thumbnails/"),
        })
      );

      const uploaded = (await getUploadedFiles(uploadsDir)).filter(
        (file) => file !== "thumbnails"
      );
      const thumbnails = await getUploadedFiles(thumbnailsDir);

      expect(uploaded).toHaveLength(1);
      expect(uploaded[0]).toMatch(/\.jpg$/);
      expect(thumbnails).toHaveLength(1);
      expect(thumbnails[0]).toMatch(/-thumb\.webp$/);
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

      const uploaded = (await getUploadedFiles(uploadsDir)).filter(
        (file) => file !== "thumbnails"
      );
      const thumbnails = await getUploadedFiles(thumbnailsDir);

      expect(uploaded).toHaveLength(2);
      expect(uploaded.some((file) => file.endsWith(".jpg"))).toBe(true);
      expect(uploaded.some((file) => file.endsWith(".webp"))).toBe(true);
      expect(thumbnails).toHaveLength(2);
      expect(thumbnails.every((file) => file.endsWith("-thumb.webp"))).toBe(
        true
      );
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

      const uploaded = (await getUploadedFiles(uploadsDir)).filter(
        (file) => file !== "thumbnails"
      );
      const thumbnails = await getUploadedFiles(thumbnailsDir);

      expect(uploaded).toHaveLength(0);
      expect(thumbnails).toHaveLength(0);
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

      const uploaded = (await getUploadedFiles(uploadsDir)).filter(
        (file) => file !== "thumbnails"
      );
      const thumbnails = await getUploadedFiles(thumbnailsDir);

      expect(uploaded).toHaveLength(0);
      expect(thumbnails).toHaveLength(0);
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

    test("should reject files larger than 30MB", async () => {
      await createUser();
      const cookie = await login();
      await fs.writeFile(oversizedFilePath, Buffer.alloc(OVERSIZED_FILE_SIZE));

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .attach("photos", oversizedFilePath);

      expect(response.status).toBe(413);
      expect(response.body.message).toBe("File is too large");
    });

    test("should remove the whole batch when one file has invalid content", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/upload")
        .set("Cookie", cookie)
        .attach("photos", path.join(fixtures, "image.jpg"))
        .attach("photos", path.join(fixtures, "fake.jpg"));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid file content: fake.jpg");

      const uploaded = (await getUploadedFiles(uploadsDir)).filter(
        (file) => file !== "thumbnails"
      );
      const thumbnails = await getUploadedFiles(thumbnailsDir);

      expect(uploaded).toHaveLength(0);
      expect(thumbnails).toHaveLength(0);
    });

    test("should upload post images and create thumbnails", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .post("/posts/image")
        .set("Cookie", cookie)
        .attach("images", path.join(fixtures, "image.jpg"));

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual([
        expect.objectContaining({
          filename: expect.stringMatching(/\.jpg$/),
          url: expect.stringContaining("/uploads/posts/"),
          thumbnail: expect.stringContaining("/uploads/posts/thumbnails/"),
        }),
      ]);

      const uploadedPostFiles = (await getUploadedFiles(postUploadsDir)).filter(
        (file) => file !== "thumbnails"
      );

      expect(uploadedPostFiles).toHaveLength(1);
      expect(await getUploadedFiles(postThumbnailsDir)).toEqual([
        expect.stringMatching(/-thumb\.webp$/),
      ]);
    });
  });
});
