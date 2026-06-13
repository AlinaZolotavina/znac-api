const multer = require("multer");
const { INTERNAL_SERVER_ERROR } = require("../utils/constants");

const errorHandler = (err, req, res) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).send({
          message: "File is too large",
        });

      case "LIMIT_FILE_COUNT":
        return res.status(400).send({
          message: "Too many files",
        });

      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).send({
          message: "Unexpected file field",
        });

      default:
        return res.status(400).send({
          message: err.message,
        });
    }
  }

  const { statusCode = 500, message } = err;

  return res.status(statusCode).send({
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: statusCode === 500 ? INTERNAL_SERVER_ERROR : message,
  });
};

module.exports = errorHandler;
