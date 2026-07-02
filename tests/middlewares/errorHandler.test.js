const multer = require("multer");

const errorHandler = require("../../middlewares/errorHandler");

const NotFoundError = require("../../errors/not-found-err");

const { INTERNAL_SERVER_ERROR } = require("../../utils/constants");

describe("errorHandler", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();
  });

  test("should handle LIMIT_FILE_SIZE", () => {
    const err = new multer.MulterError("LIMIT_FILE_SIZE");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      message: "File is too large",
    });
  });

  test("should handle LIMIT_FILE_COUNT", () => {
    const err = new multer.MulterError("LIMIT_FILE_COUNT");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      message: "Too many files",
    });
  });

  test("should handle LIMIT_UNEXPECTED_FILE", () => {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      message: "Unexpected file field",
    });
  });

  test("should handle unknown MulterError", () => {
    const err = new multer.MulterError("UNKNOWN");

    err.message = "Unknown multer error";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      message: "Unknown multer error",
    });
  });

  test("should handle application errors", () => {
    const err = new NotFoundError("Post is not found");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.send).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Post is not found",
    });
  });

  test("should handle internal server errors", () => {
    const err = new Error("Database crashed");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.send).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: INTERNAL_SERVER_ERROR,
    });
  });

  test("should preserve custom error code", () => {
    const err = new Error("Bad request");

    err.statusCode = 400;
    err.code = "BAD_REQUEST";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Bad request",
    });
  });
});
