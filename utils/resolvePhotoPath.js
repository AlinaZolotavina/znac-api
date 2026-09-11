const path = require("path");
const getUploadsDirectory = require("./getUploadsDirectory");

const resolvePhotoPath = (photo) => {
  if (photo.filename) {
    return path.join(getUploadsDirectory(), "gallery", photo.filename);
  }

  if (photo.link?.startsWith(`${process.env.API_URL}public/`)) {
    return path.join(__dirname, "../public", path.basename(photo.link));
  }

  return null;
};

module.exports = resolvePhotoPath;
