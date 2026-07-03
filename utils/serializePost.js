const resolvePostPhotoUrl = require("./resolvePostPhotoUrl");

const serializePost = (post) => {
  const postObject = post.toObject();

  return {
    ...postObject,
    photoLink: resolvePostPhotoUrl(postObject),
  };
};

module.exports = serializePost;
