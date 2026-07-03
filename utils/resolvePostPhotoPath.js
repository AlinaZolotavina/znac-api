const path = require("path");

const resolvePostPhotoPath = (post) => {
  if (post.photoFilename) {
    return path.join(__dirname, "../uploads/posts", post.photoFilename);
  }

  if (post.photoLink?.startsWith(`${process.env.API_URL}public/`)) {
    return path.join(__dirname, "../public", path.basename(post.photoLink));
  }

  return null;
};

module.exports = resolvePostPhotoPath;
