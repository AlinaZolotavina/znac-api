const resolvePhotoUrl = require("./resolvePhotoUrl");

const serializePhoto = (photo) => {
  const photoObject = photo.toObject();

  return {
    ...photoObject,
    link: resolvePhotoUrl(photoObject),
  };
};

module.exports = serializePhoto;
