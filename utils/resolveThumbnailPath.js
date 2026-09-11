const path = require("path");
const getUploadsDirectory = require("./getUploadsDirectory");

const resolveThumbnailPath = (filename, directory) => {
  if (!filename) {
    return null;
  }

  const thumbnailFilename = `${path.parse(filename).name}-thumb.webp`;

  return path.join(
    getUploadsDirectory(),
    directory,
    "thumbnails",
    thumbnailFilename
  );
};

module.exports = resolveThumbnailPath;
