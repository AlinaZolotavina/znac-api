const path = require("path");

const resolveThumbnailPath = (filename, directory) => {
  if (!filename) {
    return null;
  }

  const thumbnailFilename = `${path.parse(filename).name}-thumb.webp`;

  return path.join(
    __dirname,
    "../uploads",
    directory,
    "thumbnails",
    thumbnailFilename
  );
};

module.exports = resolveThumbnailPath;
