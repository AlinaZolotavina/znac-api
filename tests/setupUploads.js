const fs = require("fs");
const path = require("path");

const uploadsDirectory = path.join(__dirname, "uploads-test");

process.env.UPLOADS_DIR = uploadsDirectory;

[
  path.join(uploadsDirectory, "gallery", "thumbnails"),
  path.join(uploadsDirectory, "posts", "thumbnails"),
  path.join(uploadsDirectory, "heroes"),
].forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});
