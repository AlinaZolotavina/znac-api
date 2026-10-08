const fs = require("fs");
const path = require("path");
const getUploadsDirectory = require("./getUploadsDirectory");

const uploadDirectories = ["gallery", "posts", "heroes"];
const thumbnailDirectories = ["gallery", "posts"];

const ensureUploadsDirectories = () => {
  fs.mkdirSync(getUploadsDirectory(), { recursive: true });

  uploadDirectories.forEach((directory) => {
    fs.mkdirSync(path.join(getUploadsDirectory(), directory), {
      recursive: true,
    });
  });

  thumbnailDirectories.forEach((directory) => {
    fs.mkdirSync(path.join(getUploadsDirectory(), directory, "thumbnails"), {
      recursive: true,
    });
  });
};

module.exports = ensureUploadsDirectories;
