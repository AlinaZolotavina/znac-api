const resolvePostPhotoUrl = (post) => {
  if (post.photoFilename) {
    return `${process.env.API_URL}uploads/posts/${post.photoFilename}`;
  }

  return post.photoLink;
};

module.exports = resolvePostPhotoUrl;
