const Photo = require("../../models/photo");

const createPhoto = async (ownerId, overrides = {}) =>
  Photo.create({
    owner: ownerId,
    link: "https://example.com/photo.jpg",
    hashtags: ["node", "express"],
    views: 0,
    ...overrides,
  });

module.exports = createPhoto;
