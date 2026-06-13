/* eslint-disable no-console */
const fs = require("fs");
const Photo = require("../models/photo");
const NotFoundError = require("../errors/not-found-err");
const {
  PHOTO_NOT_FOUND_ERROR_MSG,
  SUCCESSFUL_PHOTO_DELETE_MSG,
} = require("../utils/constants");

const getPhotos = (req, res, next) => {
  Photo.find({})
    .then((photos) => res.status(200).send(photos))
    .catch(next);
};

const findPhoto = (req, res, next) => {
  const tag = req.body.keyWord?.trim().toLowerCase();
  Photo.find(tag ? { hashtags: tag } : {})
    .then((photos) => {
      res.send(photos);
    })
    .catch(next);
};

const deletePhoto = (req, res, next) => {
  const { photoId } = req.params;

  Photo.findOneAndDelete({
    _id: photoId,
    owner: req.user._id,
  })
    .then((photo) => {
      if (!photo) {
        throw new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG);
      }

      const photoName = photo.link.slice(photo.link.lastIndexOf("/") + 1);

      const path = `./public/${photoName}`;

      fs.access(path, fs.constants.F_OK, (error) => {
        if (error) {
          console.error(`File ${path} does not exist.`);
        } else {
          fs.unlink(path, (err) => {
            if (err) {
              console.error(`Failed to delete file: ${err}`);
            }
          });
        }
      });

      res.status(200).send({
        message: SUCCESSFUL_PHOTO_DELETE_MSG,
      });
    })
    .catch(next);
};

const addPhoto = (req, res, next) => {
  const { link, hashtags, views } = req.body;
  const hashtagsArray = hashtags.trim().toLowerCase().split(/\s+/);
  Photo.create({ owner: req.user._id, link, hashtags: hashtagsArray, views })
    .then((photo) => res.status(201).send(photo))
    .catch(next);
};

const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new NotFoundError("No photo to upload"));
    }

    const uploadedFiles = req.files.map((file) => ({
      name: file.filename,
      size: file.size,
      path: `https://api.znac.org/public/${file.filename}`,
    }));

    return res.status(201).send({
      status: true,
      message: "Files uploaded successfully",
      data: uploadedFiles,
    });
  } catch (err) {
    return next(err);
  }
};

const increaseViews = (req, res, next) => {
  const { photoId } = req.params;
  Photo.findByIdAndUpdate(photoId, { $inc: { views: 1 } }, { new: true })
    .then((photo) => {
      if (!photo) {
        return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
      }
      res.send(photo);
    })
    .catch(next);
};

const editHashtags = (req, res, next) => {
  const { photoId } = req.params;
  const { newHashtags } = req.body;

  Photo.findOneAndUpdate(
    {
      _id: photoId,
      owner: req.user._id,
    },
    {
      hashtags: newHashtags,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .then((photo) => {
      if (!photo) {
        throw new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG);
      }

      res.send(photo);
    })
    .catch(next);
};

module.exports = {
  getPhotos,
  findPhoto,
  deletePhoto,
  addPhoto,
  uploadPhoto,
  increaseViews,
  editHashtags,
};
