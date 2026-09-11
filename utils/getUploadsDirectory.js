const path = require("path");

const getUploadsDirectory = () =>
  process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");

module.exports = getUploadsDirectory;
