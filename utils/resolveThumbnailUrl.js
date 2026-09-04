const path = require("path");

const resolveThumbnailUrl = (item, directory) => {
  const filename = item.filename || item.photoFilename;

  if (!filename) {
    return item.link || item.photoLink;
  }

  const thumbnailFilename = `${path.parse(filename).name}-thumb.webp`;

  return `${process.env.API_URL}uploads/${directory}/thumbnails/${thumbnailFilename}`;
};

module.exports = resolveThumbnailUrl;
