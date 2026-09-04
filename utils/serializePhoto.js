const resolvePhotoUrl = require("./resolvePhotoUrl");
const resolveThumbnailUrl = require("./resolveThumbnailUrl");

const serializePhoto = (photo) => {
  const photoObject = photo.toObject();

  return {
    ...photoObject,
    link: resolvePhotoUrl(photoObject),
    thumbnail: resolveThumbnailUrl(photoObject, "gallery"),
  };
};

module.exports = serializePhoto;
