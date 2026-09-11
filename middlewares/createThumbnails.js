const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");
const removeFiles = require("../utils/removeFiles");
const getUploadsDirectory = require("../utils/getUploadsDirectory");
const allowedDirectories = new Set(["gallery", "posts"]);

const createThumbnails = (directory) => {
  if (!allowedDirectories.has(directory)) {
    throw new Error(`Unknown upload directory: ${directory}`);
  }

  const thumbnailsDirectory = path.join(
    getUploadsDirectory(),
    directory,
    "thumbnails"
  );

  return async (req, res, next) => {
    if (!req.files?.length) {
      return next();
    }

    const thumbnailFiles = req.files.map((file) => {
      const thumbnailFilename = `${path.parse(file.filename).name}-thumb.webp`;

      return {
        file,
        thumbnailFilename,
        thumbnailPath: path.join(thumbnailsDirectory, thumbnailFilename),
      };
    });

    const results = await Promise.allSettled(
      thumbnailFiles.map(async ({ file, thumbnailPath }) => {
        const fileBuffer = await fs.readFile(file.path);

        return sharp(fileBuffer)
          .rotate()
          .resize({
            width: 600,
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);
      })
    );

    const failedResult = results.find((result) => result.status === "rejected");

    if (failedResult) {
      const createdThumbnailPaths = results.flatMap((result, index) =>
        result.status === "fulfilled"
          ? [thumbnailFiles[index].thumbnailPath]
          : []
      );

      await removeFiles(createdThumbnailPaths);

      return next(failedResult.reason);
    }

    thumbnailFiles.forEach(({ file, thumbnailFilename }) => {
      file.thumbnailFilename = thumbnailFilename;
    });

    return next();
  };
};

module.exports = createThumbnails;
