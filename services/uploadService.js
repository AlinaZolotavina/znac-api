const uploadPhoto = (files, uploadType) =>
  files.map((file) => ({
    filename: file.filename,
    size: file.size,
    url: `${process.env.API_URL}uploads/${uploadType}/${file.filename}`,
  }));

module.exports = {
  uploadPhoto,
};
