const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const mongo = require("./helpers/setupMongo");
const SiteSettings = require("../models/siteSettings");
const getUploadsDirectory = require("../utils/getUploadsDirectory");
const siteSettingsService = require("../services/siteSettingsService");

const heroesDirectory = path.join(getUploadsDirectory(), "heroes");

const removeHeroFile = (filename) =>
  fs.rm(path.join(heroesDirectory, filename), {
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });

beforeAll(mongo.connect);

afterEach(async () => {
  jest.restoreAllMocks();
  await SiteSettings.deleteMany({});
  await removeHeroFile("old-main.jpg");
  await removeHeroFile("new-main.jpg");
  await removeHeroFile("new-gallery.jpg");
});

afterAll(mongo.disconnect);

describe("siteSettingsService", () => {
  test("creates singleton settings with defaults", async () => {
    const settings = await siteSettingsService.getOrCreateSiteSettings();

    expect(settings._id).toBe("site-settings");
    expect(settings.heroes.main).toBeNull();
    expect(settings.heroes.gallery).toBeNull();
    expect(settings.auth.signupEnabled).toBe(false);
    expect(settings.colors.accent.value).toBe("#c5e7bc");

    await siteSettingsService.getOrCreateSiteSettings();

    expect(await SiteSettings.countDocuments()).toBe(1);
  });

  test("returns stable hero image structure when images are not set", async () => {
    await expect(siteSettingsService.getHeroImages()).resolves.toEqual({
      main: null,
      gallery: null,
    });
  });

  test("returns public settings without administrative fields", async () => {
    const userId = new mongoose.Types.ObjectId();

    await SiteSettings.create({
      _id: "site-settings",
      heroes: {
        main: {
          filename: "new-main.jpg",
          url: "https://api.example.test/uploads/heroes/new-main.jpg",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedBy: userId,
        },
        gallery: null,
      },
      auth: {
        signupEnabled: false,
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedBy: userId,
      },
      colors: {
        accent: {
          value: "#aabbcc",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedBy: userId,
        },
      },
    });

    await expect(siteSettingsService.getPublicSettings()).resolves.toEqual({
      heroes: {
        main: {
          filename: "new-main.jpg",
          url: "https://api.example.test/uploads/heroes/new-main.jpg",
          updatedAt: expect.any(Date),
        },
        gallery: null,
      },
      auth: {
        signupEnabled: false,
      },
      colors: {
        accent: {
          value: "#aabbcc",
        },
      },
    });
  });

  test("keeps main and gallery hero images independent", async () => {
    const userId = new mongoose.Types.ObjectId();

    await siteSettingsService.updateHeroImage(
      "main",
      {
        filename: "new-main.jpg",
      },
      userId
    );
    await siteSettingsService.updateHeroImage(
      "gallery",
      {
        filename: "new-gallery.jpg",
      },
      userId
    );

    const heroes = await siteSettingsService.getHeroImages();

    expect(heroes.main.filename).toBe("new-main.jpg");
    expect(heroes.gallery.filename).toBe("new-gallery.jpg");
  });

  test("updates hero image and removes previous file after saving", async () => {
    const userId = new mongoose.Types.ObjectId();

    await fs.writeFile(path.join(heroesDirectory, "old-main.jpg"), "old");
    await SiteSettings.create({
      _id: "site-settings",
      heroes: {
        main: {
          filename: "old-main.jpg",
          url: "https://api.example.test/uploads/heroes/old-main.jpg",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedBy: userId,
        },
        gallery: null,
      },
      auth: {
        signupEnabled: true,
      },
    });

    const result = await siteSettingsService.updateHeroImage(
      "main",
      {
        filename: "new-main.jpg",
      },
      userId
    );

    expect(result).toEqual({
      filename: "new-main.jpg",
      url: expect.stringContaining("/uploads/heroes/new-main.jpg"),
      updatedAt: expect.any(Date),
    });

    const settings = await SiteSettings.findById("site-settings");

    expect(settings.heroes.main.filename).toBe("new-main.jpg");
    expect(settings.heroes.main.updatedBy.toString()).toBe(userId.toString());
    await expect(
      fs.access(path.join(heroesDirectory, "old-main.jpg"))
    ).rejects.toThrow();
  });

  test("does not remove old hero file when saving new settings fails", async () => {
    const userId = new mongoose.Types.ObjectId();
    const settings = await SiteSettings.create({
      _id: "site-settings",
      heroes: {
        main: {
          filename: "old-main.jpg",
          url: "https://api.example.test/uploads/heroes/old-main.jpg",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedBy: userId,
        },
        gallery: null,
      },
      auth: {
        signupEnabled: true,
      },
    });

    await fs.writeFile(path.join(heroesDirectory, "old-main.jpg"), "old");
    jest.spyOn(SiteSettings, "findById").mockResolvedValueOnce(settings);
    jest
      .spyOn(settings, "save")
      .mockRejectedValueOnce(new Error("save failed"));

    await expect(
      siteSettingsService.updateHeroImage(
        "main",
        {
          filename: "new-main.jpg",
        },
        userId
      )
    ).rejects.toThrow("save failed");

    await expect(
      fs.access(path.join(heroesDirectory, "old-main.jpg"))
    ).resolves.toBeUndefined();

    jest.restoreAllMocks();
  });

  test("rejects invalid hero image slot", async () => {
    await expect(
      siteSettingsService.updateHeroImage(
        "about",
        {
          filename: "new-main.jpg",
        },
        new mongoose.Types.ObjectId()
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid hero image slot",
    });
  });
});
