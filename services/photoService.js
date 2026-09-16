const Photo = require("../models/photo");
const Hashtag = require("../models/hashtag");
const NotFoundError = require("../errors/not-found-err");
const escapeRegex = require("../utils/escapeRegex");
const normalizeHashtags = require("../utils/normalizeHashtags");
const resolvePhotoPath = require("../utils/resolvePhotoPath");
const resolveThumbnailPath = require("../utils/resolveThumbnailPath");
const serializePhoto = require("../utils/serializePhoto");
const removeFiles = require("../utils/removeFiles");
const ensureThumbnail = require("../utils/ensureThumbnail");

const { PHOTO_NOT_FOUND_ERROR_MSG } = require("../utils/constants");

const getPhotos = async ({ skip, limit }) => {
  const [photos, total] = await Promise.all([
    Photo.find({}).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Photo.countDocuments(),
  ]);

  await ensureThumbnail(photos, "gallery");

  return {
    data: photos.map(serializePhoto),
    total,
  };
};

const touchHashtag = async (keyWord) => {
  const name = keyWord.trim().toLowerCase();

  if (!name) {
    return;
  }

  try {
    await Hashtag.findOneAndUpdate(
      { name },
      {
        $set: {
          createdAt: new Date(),
        },
        $setOnInsert: {
          name,
        },
      },
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.error("Failed to update hashtag statistics:", err);
  }
};

const findPhoto = async ({ skip, limit, keyWord = "" }) => {
  const tag = keyWord.trim();

  const filter = tag
    ? {
        hashtags: {
          $regex: `(^|\\s)${escapeRegex(tag)}(?=\\s|$)`,
          $options: "i",
        },
      }
    : {};

  const [photos, total] = await Promise.all([
    Photo.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Photo.countDocuments(filter),
  ]);

  if (tag && total > 0) {
    await touchHashtag(tag);
  }

  await ensureThumbnail(photos, "gallery");

  return {
    data: photos.map(serializePhoto),
    total,
  };
};

const addPhoto = ({ ownerId, link, filename, hashtags, views }) =>
  Photo.create({
    owner: ownerId,
    link,
    filename,
    hashtags: normalizeHashtags(hashtags),
    views,
  });

const editHashtags = async ({ photoId, ownerId, hashtags }) => {
  const photo = await Photo.findOneAndUpdate(
    {
      _id: photoId,
      owner: ownerId,
    },
    {
      hashtags: normalizeHashtags(hashtags),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!photo) {
    throw new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG);
  }

  return photo;
};

const increaseViews = async (photoId) => {
  const photo = await Photo.findByIdAndUpdate(
    photoId,
    {
      $inc: { views: 1 },
    },
    {
      new: true,
    }
  );

  if (!photo) {
    throw new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG);
  }

  return photo;
};

const deletePhoto = async ({ photoId, ownerId }) => {
  const photo = await Photo.findOneAndDelete({
    _id: photoId,
    owner: ownerId,
  });

  if (!photo) {
    throw new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG);
  }

  const filePath = resolvePhotoPath(photo);
  const thumbnailPath = resolveThumbnailPath(photo.filename, "gallery");

  await removeFiles([filePath, thumbnailPath]);

  return photo;
};

module.exports = {
  getPhotos,
  findPhoto,
  addPhoto,
  editHashtags,
  increaseViews,
  deletePhoto,
};
