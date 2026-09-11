const FileType = require("file-type");
const removeFiles = require("../utils/removeFiles");

const getFileType = (filePath) => FileType.fromFile(filePath);

const BadRequestError = require("../errors/bad-request-err");
const { NO_PHOTO_TO_UPLOAD_ERROR_MSG } = require("../utils/constants");

const validateUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return next(new BadRequestError(NO_PHOTO_TO_UPLOAD_ERROR_MSG));
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of req.files) {
      const detectedType = await getFileType(file.path);

      if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
        await removeFiles(req.files.map(({ path: filePath }) => filePath));

        return res.status(400).send({
          message: `Invalid file content: ${file.originalname}`,
        });
      }
    }

    return next();
  } catch (err) {
    try {
      await removeFiles(
        (req.files || []).map(({ path: filePath }) => filePath)
      );
    } catch (cleanupError) {
      return next(cleanupError);
    }

    return next(err);
  }
};

module.exports = validateUploadedFiles;
