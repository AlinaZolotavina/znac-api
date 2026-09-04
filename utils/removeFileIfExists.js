const fs = require("fs/promises");

const removeFileIfExists = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
};

module.exports = removeFileIfExists;
