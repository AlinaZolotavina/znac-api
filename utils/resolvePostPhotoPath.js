const path = require("path");
const getUploadsDirectory = require("./getUploadsDirectory");

const resolvePostPhotoPath = (post) => {
  if (post.photoFilename) {
    return path.join(getUploadsDirectory(), "posts", post.photoFilename);
  }

  if (post.photoLink?.startsWith(`${process.env.API_URL}public/`)) {
    return path.join(__dirname, "../public", path.basename(post.photoLink));
  }

  return null;
};

module.exports = resolvePostPhotoPath;
