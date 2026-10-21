require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const sharp = require("sharp");

const Photo = require("../models/photo");
const Post = require("../models/post");

const uploadsDirectory = path.join(__dirname, "..", "uploads");

const getThumbnailFilename = (filename) =>
  `${path.parse(filename).name}-thumb.webp`;

const generateThumbnails = async ({ Model, filenameField, directory }) => {
  const records = await Model.find({
    [filenameField]: { $exists: true, $ne: "" },
  })
    .select(filenameField)
    .lean();

  const sourceDirectory = path.join(uploadsDirectory, directory);
  const thumbnailsDirectory = path.join(sourceDirectory, "thumbnails");

  await fs.mkdir(thumbnailsDirectory, { recursive: true });

  let created = 0;
  let skipped = 0;
  let missing = 0;

  for (const record of records) {
    const filename = path.basename(record[filenameField]);
    const sourcePath = path.join(sourceDirectory, filename);
    const thumbnailPath = path.join(
      thumbnailsDirectory,
      getThumbnailFilename(filename)
    );

    try {
      await fs.access(thumbnailPath);
      skipped += 1;
      continue;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    try {
      await fs.access(sourcePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        missing += 1;
        console.warn(`Original file not found: ${sourcePath}`);
        continue;
      }

      throw error;
    }

    await sharp(await fs.readFile(sourcePath))
      .rotate()
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    created += 1;
    console.log(`Created thumbnail: ${thumbnailPath}`);
  }

  return { directory, records: records.length, created, skipped, missing };
};

const main = async () => {
  await mongoose.connect(process.env.DB_URL);

  try {
    const results = await Promise.all([
      generateThumbnails({
        Model: Photo,
        filenameField: "filename",
        directory: "gallery",
      }),
      generateThumbnails({
        Model: Post,
        filenameField: "photoFilename",
        directory: "posts",
      }),
    ]);

    console.table(results);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
