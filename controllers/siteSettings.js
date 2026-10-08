const siteSettingsService = require("../services/siteSettingsService");

const getSettings = async (req, res, next) => {
  try {
    const settings = await siteSettingsService.getPublicSettings();

    res.status(200).send(settings);
  } catch (err) {
    next(err);
  }
};

const updateHeroImage = async (req, res, next) => {
  try {
    const heroImage = await siteSettingsService.updateHeroImage(
      req.params.slot,
      req.file,
      req.user._id
    );

    res.status(200).send(heroImage);
  } catch (err) {
    next(err);
  }
};

const updateSignupSettings = async (req, res, next) => {
  try {
    const authSettings = await siteSettingsService.updateSignupEnabled(
      req.body.enabled,
      req.user._id
    );

    res.status(200).send(authSettings);
  } catch (err) {
    next(err);
  }
};

const updateAccentColor = async (req, res, next) => {
  try {
    const accentColor = await siteSettingsService.updateAccentColor(
      req.body.color,
      req.user._id
    );

    res.status(200).send(accentColor);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateHeroImage,
  updateSignupSettings,
  updateAccentColor,
};
