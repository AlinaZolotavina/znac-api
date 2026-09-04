const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const resolvePhotoPath = require("./resolvePhotoPath");
const resolvePostPhotoPath = require("./resolvePostPhotoPath");
const resolveThumbnailPath = require("./resolveThumbnailPath");

const allowedDirectories = new Set(["gallery", "posts"]);

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }

    throw err;
  }
};

const getOriginalPath = (document, directory) => {
  if (directory === "gallery") {
    return resolvePhotoPath(document);
  }

  return resolvePostPhotoPath(document);
};

const createThumbnail = async (document, directory) => {
  const filename =
    directory === "gallery" ? document.filename : document.photoFilename;

  if (!filename) {
    return;
  }

  const originalPath = getOriginalPath(document, directory);
  const thumbnailPath = resolveThumbnailPath(filename, directory);

  if (!originalPath || !thumbnailPath) {
    return;
  }

  const thumbnailAlreadyExists = await fileExists(thumbnailPath);

  if (thumbnailAlreadyExists) {
    return;
  }

  const originalExists = await fileExists(originalPath);

  if (!originalExists) {
    return;
  }

  await fs.mkdir(path.dirname(thumbnailPath), {
    recursive: true,
  });

  await sharp(originalPath)
    .rotate()
    .resize({
      width: 600,
      withoutEnlargement: true,
    })
    .webp({
      quality: 80,
    })
    .toFile(thumbnailPath);
};

const ensureThumbnail = async (documents, directory) => {
  if (!allowedDirectories.has(directory)) {
    throw new Error(`Unknown upload directory: ${directory}`);
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    return documents;
  }

  await Promise.all(
    documents.map((document) => createThumbnail(document, directory))
  );

  return documents;
};

module.exports = ensureThumbnail;
