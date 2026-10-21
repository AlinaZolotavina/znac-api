const mongoose = require("mongoose");
const Post = require("../models/post");

const THEME_RENAMES = [
  ["Web development", "Development"],
  ["Web design", "Design"],
];

const migratePostThemes = async ({ dryRun = false } = {}) => {
  const results = [];

  for (const [from, to] of THEME_RENAMES) {
    if (dryRun) {
      const matchedCount = await Post.countDocuments({ theme: from });
      results.push({ from, to, matchedCount, modifiedCount: 0 });
    } else {
      const { matchedCount, modifiedCount } = await Post.updateMany(
        { theme: from },
        { $set: { theme: to } },
        { runValidators: true }
      );
      results.push({ from, to, matchedCount, modifiedCount });
    }
  }

  return results;
};

if (require.main === module) {
  require("dotenv").config();

  const run = async () => {
    try {
      if (!process.env.DB_URL) {
        throw new Error("Missing environment variable: DB_URL");
      }
      await mongoose.connect(process.env.DB_URL);
      const results = await migratePostThemes({
        dryRun: process.argv.includes("--dry-run"),
      });
      // eslint-disable-next-line no-console
      console.table(results);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Post theme migration failed:", error.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  };

  run();
}

module.exports = migratePostThemes;
