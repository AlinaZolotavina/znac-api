const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const BadRequestError = require("../errors/bad-request-err");

const allowedDirectories = new Set(["gallery", "posts"]);

const createUpload = (directory) => {
  if (!allowedDirectories.has(directory)) {
    throw new Error(`Unknown upload directory: ${directory}`);
  }

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(__dirname, "../uploads", directory));
    },

    filename(req, file, cb) {
      const extension = path.extname(file.originalname).toLowerCase();

      cb(null, `${crypto.randomUUID()}${extension}`);
    },
  });

  return multer({
    storage,

    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 10,
    },

    fileFilter(req, file, cb) {
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

      const extension = path.extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        return cb(
          new BadRequestError(`Unsupported file type: ${file.originalname}`)
        );
      }

      cb(null, true);
    },
  });
};

module.exports = createUpload;
