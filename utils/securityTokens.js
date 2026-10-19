const { createHash, randomBytes } = require("crypto");

const TOKEN_LIFETIME_MS = 20 * 60 * 1000;
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const createToken = () => randomBytes(32).toString("hex");
const isToken = (token) =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

const resetTokenFields = {
  resetPasswordTokenHash: "",
  resetPasswordExpiresAt: "",
};

const emailChangeFields = Object.fromEntries(
  [
    "pendingEmail",
    "emailChangeCurrentEmail",
    "emailChangeRequestId",
    "emailChangeTokenVersion",
    "emailChangeExpiresAt",
    "emailChangeOldTokenHash",
    "emailChangeNewTokenHash",
    "emailChangeOldConfirmed",
    "emailChangeNewConfirmed",
  ].map((field) => [field, ""])
);

module.exports = {
  TOKEN_LIFETIME_MS,
  hashToken,
  createToken,
  isToken,
  resetTokenFields,
  emailChangeFields,
};
