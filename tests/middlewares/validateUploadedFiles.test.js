const fs = require("fs/promises");
const FileType = require("file-type");

jest.mock("fs/promises", () => ({
  unlink: jest.fn(),
}));

jest.mock("file-type", () => ({
  fromFile: jest.fn(),
}));

const validateUploadedFiles = require("../../middlewares/validateUploadedFiles");

describe("validateUploadedFiles", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      files: [],
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test("should call next when there are no files", async () => {
    await validateUploadedFiles(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(FileType.fromFile).not.toHaveBeenCalled();
  });

  test("should accept valid jpeg", async () => {
    req.files = [
      {
        path: "/tmp/photo.jpg",
        originalname: "photo.jpg",
      },
    ];

    FileType.fromFile.mockResolvedValue({
      mime: "image/jpeg",
    });

    await validateUploadedFiles(req, res, next);

    expect(FileType.fromFile).toHaveBeenCalledWith("/tmp/photo.jpg");
    expect(fs.unlink).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  test("should accept valid png", async () => {
    req.files = [
      {
        path: "/tmp/photo.png",
        originalname: "photo.png",
      },
    ];

    FileType.fromFile.mockResolvedValue({
      mime: "image/png",
    });

    await validateUploadedFiles(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("should accept valid webp", async () => {
    req.files = [
      {
        path: "/tmp/photo.webp",
        originalname: "photo.webp",
      },
    ];

    FileType.fromFile.mockResolvedValue({
      mime: "image/webp",
    });

    await validateUploadedFiles(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("should reject unknown file type", async () => {
    req.files = [
      {
        path: "/tmp/file",
        originalname: "file.jpg",
      },
    ];

    FileType.fromFile.mockResolvedValue(undefined);

    await validateUploadedFiles(req, res, next);

    expect(fs.unlink).toHaveBeenCalledWith("/tmp/file");

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      message: "Invalid file content: file.jpg",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should reject unsupported mime type", async () => {
    req.files = [
      {
        path: "/tmp/file.gif",
        originalname: "file.gif",
      },
    ];

    FileType.fromFile.mockResolvedValue({
      mime: "image/gif",
    });

    await validateUploadedFiles(req, res, next);

    expect(fs.unlink).toHaveBeenCalledWith("/tmp/file.gif");

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledWith({
      message: "Invalid file content: file.gif",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should validate all uploaded files", async () => {
    req.files = [
      {
        path: "/tmp/1.jpg",
        originalname: "1.jpg",
      },
      {
        path: "/tmp/2.png",
        originalname: "2.png",
      },
    ];

    FileType.fromFile
      .mockResolvedValueOnce({
        mime: "image/jpeg",
      })
      .mockResolvedValueOnce({
        mime: "image/png",
      });

    await validateUploadedFiles(req, res, next);

    expect(FileType.fromFile).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledWith();
  });

  test("should stop validating after first invalid file", async () => {
    req.files = [
      {
        path: "/tmp/1.gif",
        originalname: "1.gif",
      },
      {
        path: "/tmp/2.jpg",
        originalname: "2.jpg",
      },
    ];

    FileType.fromFile.mockResolvedValue({
      mime: "image/gif",
    });

    await validateUploadedFiles(req, res, next);

    expect(FileType.fromFile).toHaveBeenCalledTimes(1);
  });

  test("should pass file type errors to next", async () => {
    const error = new Error("file-type failed");

    req.files = [
      {
        path: "/tmp/photo.jpg",
        originalname: "photo.jpg",
      },
    ];

    FileType.fromFile.mockRejectedValue(error);

    await validateUploadedFiles(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("should pass unlink errors to next", async () => {
    const error = new Error("unlink failed");

    req.files = [
      {
        path: "/tmp/file.gif",
        originalname: "file.gif",
      },
    ];

    FileType.fromFile.mockResolvedValue({
      mime: "image/gif",
    });

    fs.unlink.mockRejectedValue(error);

    await validateUploadedFiles(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
