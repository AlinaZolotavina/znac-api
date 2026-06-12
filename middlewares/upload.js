const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../public"));
  },

  filename(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },

  fileFilter(req, file, cb) {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !allowedExtensions.includes(extension)
    ) {
      return cb(new Error(`Unsupported file type: ${file.originalname}`));
    }

    cb(null, true);
  },
});

module.exports = upload;
