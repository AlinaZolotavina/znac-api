const uploadPhoto = (files, uploadType) =>
  files.map((file) => {
    const uploadedFile = {
      filename: file.filename,
      size: file.size,
      url: `${process.env.API_URL}uploads/${uploadType}/${file.filename}`,
    };

    if (file.thumbnailFilename) {
      uploadedFile.thumbnail = `${process.env.API_URL}uploads/${uploadType}/thumbnails/${file.thumbnailFilename}`;
    }

    return uploadedFile;
  });

module.exports = {
  uploadPhoto,
};
