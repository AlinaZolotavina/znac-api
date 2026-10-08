const fs = require("fs/promises");
const path = require("path");
const request = require("./helpers/requestWithOrigin");
const mongo = require("./helpers/setupMongo");
const app = require("../app");

const User = require("../models/user");
const SiteSettings = require("../models/siteSettings");
const createUser = require("./helpers/createUser");
const login = require("./helpers/login");
const getUploadsDirectory = require("../utils/getUploadsDirectory");

const fixtures = path.join(__dirname, "fixtures");
const heroesDirectory = path.join(getUploadsDirectory(), "heroes");

const getHeroFiles = async () =>
  (await fs.readdir(heroesDirectory)).filter((file) => file !== ".gitkeep");

const removeHeroFile = (filename) =>
  fs.rm(path.join(heroesDirectory, filename), {
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });

const cleanHeroUploads = async () => {
  const files = await getHeroFiles();

  await Promise.all(files.map(removeHeroFile));
};

beforeAll(mongo.connect);

beforeEach(cleanHeroUploads);

afterEach(async () => {
  await User.deleteMany({});
  await SiteSettings.deleteMany({});
  await cleanHeroUploads();
});

afterAll(mongo.disconnect);

describe("Settings", () => {
  describe("GET /settings", () => {
    test("should return public settings without administrative fields", async () => {
      const response = await request(app).get("/settings");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        heroes: {
          main: null,
          gallery: null,
        },
        auth: {
          signupEnabled: false,
        },
        colors: {
          accent: {
            value: "#c5e7bc",
          },
        },
      });
      expect(response.body.heroes.main).toBeNull();
    });
  });

  describe("PATCH /settings/heroes/:slot", () => {
    test("should reject hero update without auth", async () => {
      const response = await request(app)
        .patch("/settings/heroes/main")
        .send({});

      expect(response.status).toBe(401);
    });

    test("should allow admin to update hero image", async () => {
      const admin = await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/heroes/main")
        .set("Cookie", cookie)
        .attach("image", path.join(fixtures, "image.jpg"));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        filename: expect.stringMatching(/\.jpg$/),
        url: expect.stringContaining("/uploads/heroes/"),
        updatedAt: expect.any(String),
      });
      expect(response.body).not.toHaveProperty("updatedBy");

      const settings = await SiteSettings.findById("site-settings");

      expect(settings.heroes.main.filename).toBe(response.body.filename);
      expect(settings.heroes.main.updatedBy.toString()).toBe(
        admin._id.toString()
      );

      const heroFiles = await getHeroFiles();

      expect(heroFiles).toEqual([response.body.filename]);
      await expect(
        fs.access(path.join(heroesDirectory, "thumbnails"))
      ).rejects.toThrow();
    });

    test("should remove previous hero file after successful update", async () => {
      const admin = await createUser({
        role: "admin",
      });
      const cookie = await login();

      await fs.writeFile(path.join(heroesDirectory, "old-main.jpg"), "old");
      await SiteSettings.create({
        _id: "site-settings",
        heroes: {
          main: {
            filename: "old-main.jpg",
            url: `${process.env.API_URL}uploads/heroes/old-main.jpg`,
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedBy: admin._id,
          },
          gallery: null,
        },
        auth: {
          signupEnabled: true,
        },
      });

      const response = await request(app)
        .patch("/settings/heroes/main")
        .set("Cookie", cookie)
        .attach("image", path.join(fixtures, "image.jpg"));

      expect(response.status).toBe(200);
      await expect(
        fs.access(path.join(heroesDirectory, "old-main.jpg"))
      ).rejects.toThrow();
    });

    test("should reject non-admin user", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/heroes/main")
        .set("Cookie", cookie)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Forbidden");
      expect(await getHeroFiles()).toHaveLength(0);
    });

    test("should reject invalid hero slot", async () => {
      await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/heroes/sidebar")
        .set("Cookie", cookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    });

    test("should reject invalid hero file type", async () => {
      await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/heroes/main")
        .set("Cookie", cookie)
        .attach("image", Buffer.from("text"), {
          filename: "hero.txt",
          contentType: "text/plain",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Unsupported file type");
      expect(await getHeroFiles()).toHaveLength(0);
    });

    test("should reject hero file over upload limit", async () => {
      await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/heroes/main")
        .set("Cookie", cookie)
        .attach("image", Buffer.alloc(30 * 1024 * 1024 + 1), {
          filename: "hero.jpg",
          contentType: "image/jpeg",
        });

      expect(response.status).toBe(413);
      expect(response.body.message).toBe("File is too large");
    });
  });

  describe("PATCH /settings/auth/signup", () => {
    test("should reject signup setting update without auth", async () => {
      const response = await request(app)
        .patch("/settings/auth/signup")
        .send({
          enabled: false,
        });

      expect(response.status).toBe(401);
    });

    test("should reject signup setting update for non-admin user", async () => {
      await createUser();
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/auth/signup")
        .set("Cookie", cookie)
        .send({
          enabled: false,
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Forbidden");
    });

    test("should allow admin to update signup setting", async () => {
      const admin = await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/auth/signup")
        .set("Cookie", cookie)
        .send({
          enabled: false,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        signupEnabled: false,
        updatedAt: expect.any(String),
      });

      const settings = await SiteSettings.findById("site-settings");

      expect(settings.auth.signupEnabled).toBe(false);
      expect(settings.auth.updatedBy.toString()).toBe(admin._id.toString());
    });

    test("should allow admin to enable signup setting", async () => {
      await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/auth/signup")
        .set("Cookie", cookie)
        .send({
          enabled: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.signupEnabled).toBe(true);

      const settings = await SiteSettings.findById("site-settings");

      expect(settings.auth.signupEnabled).toBe(true);
    });

    test("should reject invalid signup setting payload", async () => {
      await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/auth/signup")
        .set("Cookie", cookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("PATCH /settings/colors/accent", () => {
    test("should allow admin to update accent color", async () => {
      const admin = await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/colors/accent")
        .set("Cookie", cookie)
        .send({
          color: "#aabbcc",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        value: "#aabbcc",
        updatedAt: expect.any(String),
      });

      const settings = await SiteSettings.findById("site-settings");

      expect(settings.colors.accent.value).toBe("#aabbcc");
      expect(settings.colors.accent.updatedBy.toString()).toBe(
        admin._id.toString()
      );
    });

    test("should reject invalid accent color payload", async () => {
      await createUser({
        role: "admin",
      });
      const cookie = await login();

      const response = await request(app)
        .patch("/settings/colors/accent")
        .set("Cookie", cookie)
        .send({
          color: "green",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    });
  });
});
