const removeFileIfExists = require("./removeFileIfExists");

const removeFiles = async (filePaths) => {
  const results = await Promise.allSettled(
    filePaths.filter(Boolean).map((filePath) => removeFileIfExists(filePath))
  );

  const failedResult = results.find((result) => result.status === "rejected");

  if (failedResult) {
    throw failedResult.reason;
  }
};

module.exports = removeFiles;
