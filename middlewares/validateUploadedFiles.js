const FileType = require("file-type");
const removeFiles = require("../utils/removeFiles");

const getFileType = (filePath) => FileType.fromFile(filePath);

const BadRequestError = require("../errors/bad-request-err");
const { NO_PHOTO_TO_UPLOAD_ERROR_MSG } = require("../utils/constants");

const getUploadedFiles = (req) => {
  if (req.files?.length) {
    return req.files;
  }

  if (req.file) {
    return [req.file];
  }

  return [];
};

const validateUploadedFiles = async (req, res, next) => {
  const uploadedFiles = getUploadedFiles(req);

  try {
    if (!uploadedFiles.length) {
      return next(new BadRequestError(NO_PHOTO_TO_UPLOAD_ERROR_MSG));
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of uploadedFiles) {
      const detectedType = await getFileType(file.path);

      if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
        await removeFiles(uploadedFiles.map(({ path: filePath }) => filePath));

        return res.status(400).send({
          message: `Invalid file content: ${file.originalname}`,
        });
      }
    }

    return next();
  } catch (err) {
    try {
      await removeFiles(uploadedFiles.map(({ path: filePath }) => filePath));
    } catch (cleanupError) {
      return next(cleanupError);
    }

    return next(err);
  }
};

module.exports = validateUploadedFiles;
