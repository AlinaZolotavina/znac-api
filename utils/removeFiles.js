const removeFileIfExists = require("./removeFileIfExists");

const removeFiles = async (filePaths) => {
  const results = await Promise.allSettled(
    filePaths.filter(Boolean).map((filePath) => removeFileIfExists(filePath))
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to delete file:", result.reason);
    }
  });
};

module.exports = removeFiles;
