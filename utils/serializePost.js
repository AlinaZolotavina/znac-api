const resolvePostPhotoUrl = require("./resolvePostPhotoUrl");
const resolveThumbnailUrl = require("./resolveThumbnailUrl");

const serializePost = (post) => {
  const postObject = post.toObject();

  return {
    ...postObject,
    photoLink: resolvePostPhotoUrl(postObject),
    thumbnail: resolveThumbnailUrl(postObject, "posts"),
  };
};

module.exports = serializePost;
