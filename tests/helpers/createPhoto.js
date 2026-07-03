const Photo = require("../../models/photo");

const createPhoto = async (ownerId, overrides = {}) => {
  const photo = {
    owner: ownerId,
    hashtags: ["node", "express"],
    views: 0,
    ...overrides,
  };

  if (!photo.link && !photo.filename) {
    photo.link = "https://example.com/photo.jpg";
  }

  return Photo.create(photo);
};

module.exports = createPhoto;
