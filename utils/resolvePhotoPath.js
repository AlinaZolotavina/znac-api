const path = require("path");

const resolvePhotoPath = (photo) => {
  if (photo.filename) {
    return path.join(__dirname, "../uploads/gallery", photo.filename);
  }

  if (photo.link?.startsWith(`${process.env.API_URL}public/`)) {
    return path.join(__dirname, "../public", path.basename(photo.link));
  }

  return null;
};

module.exports = resolvePhotoPath;
