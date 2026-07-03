const resolvePhotoUrl = (photo) => {
  if (photo.filename) {
    return `${process.env.API_URL}uploads/gallery/${photo.filename}`;
  }

  return photo.link;
};

module.exports = resolvePhotoUrl;
