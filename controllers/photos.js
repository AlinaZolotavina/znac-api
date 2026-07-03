/* eslint-disable no-console */
const photoService = require("../services/photoService");

const getPagination = require("../utils/pagination");
const serializePhoto = require("../utils/serializePhoto");

const { SUCCESSFUL_PHOTO_DELETE_MSG } = require("../utils/constants");

const getPhotos = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { data, total } = await photoService.getPhotos({
      skip,
      limit,
    });

    res.status(200).send({
      data,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

const findPhoto = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { data, total } = await photoService.findPhoto({
      skip,
      limit,
      keyWord: req.body.keyWord,
    });

    res.status(200).send({
      data,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

const addPhoto = (req, res, next) => {
  const { link, filename, hashtags, views } = req.body;
  photoService
    .addPhoto({
      ownerId: req.user._id,
      link,
      filename,
      hashtags,
      views,
    })
    .then((photo) => {
      res.status(201).send(serializePhoto(photo));
    })
    .catch(next);
};

const deletePhoto = (req, res, next) => {
  photoService
    .deletePhoto({
      ownerId: req.user._id,
      photoId: req.params.photoId,
    })
    .then(() =>
      res.status(200).send({
        message: SUCCESSFUL_PHOTO_DELETE_MSG,
      })
    )
    .catch(next);
};

const increaseViews = (req, res, next) => {
  photoService
    .increaseViews(req.params.photoId)
    .then((photo) => res.send(photo))
    .catch(next);
};

const editHashtags = (req, res, next) => {
  photoService
    .editHashtags({
      ownerId: req.user._id,
      photoId: req.params.photoId,
      hashtags: req.body.newHashtags,
    })
    .then((photo) => res.send(photo))
    .catch(next);
};

module.exports = {
  getPhotos,
  findPhoto,
  deletePhoto,
  addPhoto,
  increaseViews,
  editHashtags,
};
