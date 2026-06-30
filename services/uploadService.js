const uploadPhoto = (files) =>
  files.map((file) => ({
    name: file.filename,
    size: file.size,
    path: `${process.env.API_URL}public/${file.filename}`,
  }));

module.exports = {
  uploadPhoto,
};
