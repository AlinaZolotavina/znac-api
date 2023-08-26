/* eslint-disable no-console */
const fs = require('fs');
const Photo = require('../models/photo');
const NotFoundError = require('../errors/not-found-err');
const { PHOTO_NOT_FOUND_ERROR_MSG, SUCCESSFUL_PHOTO_DELETE_MSG } = require('../utils/constants');

const getPhotos = (req, res, next) => {
  Photo.find({})
    .then((photos) => res.status(200).send(photos))
    .catch(next);
};

const findPhoto = (req, res, next) => {
  const { keyWord } = req.body;
  Photo.find({ hashtags: { $regex: keyWord } })
    .then((photos) => {
      res.send(photos);
    })
    .catch(next);
};

const deletePhoto = (req, res, next) => {
  const { photoId } = req.params;
  Photo.findById(photoId)
    .then((photo) => {
      if (!photo) {
        return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
      }
      // if (photo.owner._id.toString() !== req.user._id.toString()) {
      //   return next(new ForbiddenError(FORBIDDEN_ERROR_MSG));
      // }
      const photoName = photo.link.slice((photo.link.lastIndexOf('/') + 1));
      const path = `./public/${photoName}`;
      fs.access(path, fs.constants.F_OK, (error) => {
        if (error) {
          console.error(`File ${path} does not exist.`);
        } else {
          console.error(`File ${path} exists.`);
          fs.unlink(path, (err) => {
            if (err) {
              console.error(`Failed to delete file: ${err}`);
              return false;
            }
            console.log(`File ${path} has been successfully deleted.`);
            return true;
          });
        }
      });
      return photo.remove();
    })
    .then(() => {
      res.status(200).send({ message: SUCCESSFUL_PHOTO_DELETE_MSG });
    })
    .catch(next);
};

const addPhoto = (req, res) => {
  const owner = req.user._id;
  Photo.create({ owner, ...req.body })
    .then((photo) => res.status(201).send(photo))
    .catch((err) => console.log(err));
};

const uploadPhoto = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new NotFoundError('No photo to upload'));
  }
  const { file } = req.files;
  const filePath = new URL(`./${file.name}`, 'https://api.znac.org/');
  return file.mv(`./public/${file.name}`)
    .then(() => {
      res.status(200).send({
        status: true,
        message: 'Photo is uploaded',
        data: {
          name: file.name,
          size: file.size,
          path: filePath,
        },
      });
    })
    .catch(next);
};

const increaseViews = (req, res, next) => {
  const { photoId } = req.params;
  let viewsCount;
  Photo.findById(photoId)
    .then((photo) => {
      if (!photo) {
        return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
      }
      viewsCount = photo.views + 1;
      return photo.updateOne({ views: viewsCount })
        .then(() => res.send(photo));
    })
    .catch((err) => console.log(err));
};

const editHashtags = (req, res, next) => {
  const { photoId } = req.params;
  const { newHashtags } = req.body;
  Photo.findByIdAndUpdate(photoId, { hashtags: newHashtags }, { new: true, runValidators: true })
    .then((photo) => {
      if (!photo) {
        return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
      }
      return res.send(photo);
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
