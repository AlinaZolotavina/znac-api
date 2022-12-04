/* eslint-disable no-console */
const Photo = require('../models/photo');
const NotFoundError = require('../errors/not-found-err');
const ForbiddenError = require('../errors/forbidden-err');
const { PHOTO_NOT_FOUND_ERROR_MSG, FORBIDDEN_ERROR_MSG, SUCCESSFUL_PHOTO_DELETE_MSG } = require('../utils/constants');

const getPhotos = (req, res, next) => {
  Photo.find({})
    .then((photos) => res.status(200).send(photos))
    .catch(next);
};

const deletePhoto = (req, res, next) => {
  const { photoId } = req.params;
  Photo.findById(photoId)
    .then((photo) => {
      if (!photo) {
        return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
      }
      if (photo.owner._id.toString() !== req.user._id.toString()) {
        return next(new ForbiddenError(FORBIDDEN_ERROR_MSG));
      }
      return photo.remove()
        .tnen(() => res.status(200).send({ message: SUCCESSFUL_PHOTO_DELETE_MSG }));
    })
    .catch(next);
};

const addPhoto = (req, res, next) => {
  const owner = req.user._id;
  Photo.create({ owner, ...req.body })
    .then((photo) => res.status(201).send(photo))
    .catch(next);
};

module.exports = {
  getPhotos,
  deletePhoto,
  addPhoto,
};
