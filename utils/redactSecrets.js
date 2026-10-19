const SECRET_KEY =
  /^(?:cookie|set-cookie|authorization|password|oldPassword|newPassword|confirmPassword|token|resetPasswordTokenHash|updateEmailLink)$/i;

const redactText = (text) =>
  text
    .replace(
      /(\/(?:reset-password|update-email)\/)[^\s/?#"'\\]+/gi,
      "$1[REDACTED]"
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED]"
    )
    .replace(/\b[a-f0-9]{64}\b/gi, "[REDACTED]");

// Preserve Winston's symbol keys while removing secrets from nested metadata.
const redactSecrets = (value, seen = new WeakSet()) => {
  if (typeof value === "string") return redactText(value);
  if (!value || typeof value !== "object" || value instanceof Date)
    return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value))
    return value.map((item) => redactSecrets(item, seen));
  const result = {};
  Reflect.ownKeys(value).forEach((key) => {
    result[key] =
      typeof key === "string" && SECRET_KEY.test(key)
        ? "[REDACTED]"
        : redactSecrets(value[key], seen);
  });
  return result;
};

module.exports = { redactSecrets, redactText };
