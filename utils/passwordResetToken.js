const { createHash, randomBytes } = require("crypto");

const RESET_TOKEN_LIFETIME_MS = 20 * 60 * 1000;
const hashResetToken = (token) =>
  createHash("sha256").update(token).digest("hex");
const createResetToken = () => randomBytes(32).toString("hex");
const isResetToken = (token) =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

const resetTokenFields = {
  resetPasswordTokenHash: "",
  resetPasswordExpiresAt: "",
};

module.exports = {
  RESET_TOKEN_LIFETIME_MS,
  hashResetToken,
  createResetToken,
  isResetToken,
  resetTokenFields,
};
