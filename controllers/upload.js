const NotFoundError = require("../errors/not-found-err");
const uploadService = require("../services/uploadService");

const { NO_PHOTO_TO_UPLOAD_ERROR_MSG } = require("../utils/constants");

const uploadPhoto = (req, res, next) => {
  try {
    if (!req.files?.length) {
      throw new NotFoundError(NO_PHOTO_TO_UPLOAD_ERROR_MSG);
    }

    res.status(201).send({
      status: true,
      message: "Files uploaded successfully",
      data: uploadService.uploadPhoto(req.files),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadPhoto,
};
