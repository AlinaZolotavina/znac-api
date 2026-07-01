const fs = require("fs/promises");
const FileType = require("file-type");

const getFileType = (filePath) => FileType.fromFile(filePath);

const validateUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return next();
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of req.files) {
      // проверяем настоящий тип файла
      const detectedType = await getFileType(file.path);

      if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
        // удаляем подозрительный файл
        await fs.unlink(file.path);

        return res.status(400).send({
          message: `Invalid file content: ${file.originalname}`,
        });
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = validateUploadedFiles;
