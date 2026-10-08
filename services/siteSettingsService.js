const path = require("path");
const SiteSettings = require("../models/siteSettings");
const BadRequestError = require("../errors/bad-request-err");
const getUploadsDirectory = require("../utils/getUploadsDirectory");
const removeFileIfExists = require("../utils/removeFileIfExists");

const SITE_SETTINGS_ID = "site-settings";
const HERO_UPLOAD_TYPE = "heroes";
const DEFAULT_ACCENT_COLOR = "#c5e7bc";
const heroSlots = new Set(["main", "gallery"]);
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

const defaultSiteSettings = {
  _id: SITE_SETTINGS_ID,
  heroes: {
    main: null,
    gallery: null,
  },
  auth: {
    signupEnabled: false,
  },
  colors: {
    accent: {
      value: DEFAULT_ACCENT_COLOR,
    },
  },
};

const getHeroUrl = (filename) =>
  `${process.env.API_URL}uploads/${HERO_UPLOAD_TYPE}/${filename}`;

const serializeHeroImage = (heroImage) => {
  if (!heroImage) {
    return null;
  }

  return {
    url: heroImage.url,
    filename: heroImage.filename,
    updatedAt: heroImage.updatedAt,
  };
};

const validateHeroSlot = (slot) => {
  if (!heroSlots.has(slot)) {
    throw new BadRequestError("Invalid hero image slot");
  }
};

const getOrCreateSiteSettings = async () => {
  const existingSettings = await SiteSettings.findById(SITE_SETTINGS_ID);

  if (existingSettings) {
    return existingSettings;
  }

  try {
    return await SiteSettings.create(defaultSiteSettings);
  } catch (err) {
    if (err.name === "MongoServerError" || err.code === 11000) {
      return SiteSettings.findById(SITE_SETTINGS_ID);
    }

    throw err;
  }
};

const getHeroImages = async () => {
  const settings = await getOrCreateSiteSettings();

  return {
    main: serializeHeroImage(settings.heroes?.main),
    gallery: serializeHeroImage(settings.heroes?.gallery),
  };
};

const getPublicSettings = async () => {
  const settings = await getOrCreateSiteSettings();
  const accentColor = settings.colors?.accent?.value || DEFAULT_ACCENT_COLOR;

  return {
    heroes: {
      main: serializeHeroImage(settings.heroes?.main),
      gallery: serializeHeroImage(settings.heroes?.gallery),
    },
    auth: {
      signupEnabled: settings.auth?.signupEnabled ?? false,
    },
    colors: {
      accent: {
        value: accentColor,
      },
    },
  };
};

const deleteOldHeroFile = async (filename) => {
  if (!filename) {
    return;
  }

  await removeFileIfExists(
    path.join(getUploadsDirectory(), "heroes", filename)
  );
};

const updateHeroImage = async (slot, file, userId) => {
  validateHeroSlot(slot);

  if (!file?.filename) {
    throw new BadRequestError("No hero image to upload");
  }

  const settings = await getOrCreateSiteSettings();
  settings.heroes = settings.heroes || {
    main: null,
    gallery: null,
  };

  const oldFilename = settings.heroes?.[slot]?.filename;
  const updatedHeroImage = {
    filename: file.filename,
    url: getHeroUrl(file.filename),
    updatedAt: new Date(),
    updatedBy: userId,
  };

  settings.heroes[slot] = updatedHeroImage;

  await settings.save();
  await deleteOldHeroFile(oldFilename);

  return serializeHeroImage(settings.heroes[slot]);
};

const isSignupEnabled = async () => {
  const settings = await getOrCreateSiteSettings();

  return settings.auth?.signupEnabled ?? false;
};

const updateSignupEnabled = async (enabled, userId) => {
  const settings = await getOrCreateSiteSettings();
  settings.auth = settings.auth || {};

  settings.auth.signupEnabled = enabled;
  settings.auth.updatedAt = new Date();
  settings.auth.updatedBy = userId;

  await settings.save();

  return {
    signupEnabled: settings.auth.signupEnabled,
    updatedAt: settings.auth.updatedAt,
  };
};

const updateAccentColor = async (color, userId) => {
  if (!hexColorPattern.test(color)) {
    throw new BadRequestError("Invalid accent color");
  }

  const settings = await getOrCreateSiteSettings();
  settings.colors = settings.colors || {};
  settings.colors.accent = settings.colors.accent || {};

  settings.colors.accent.value = color.toLowerCase();
  settings.colors.accent.updatedAt = new Date();
  settings.colors.accent.updatedBy = userId;

  await settings.save();

  return {
    value: settings.colors.accent.value,
    updatedAt: settings.colors.accent.updatedAt,
  };
};

module.exports = {
  DEFAULT_ACCENT_COLOR,
  getOrCreateSiteSettings,
  getPublicSettings,
  getHeroImages,
  updateHeroImage,
  deleteOldHeroFile,
  isSignupEnabled,
  updateSignupEnabled,
  updateAccentColor,
};
