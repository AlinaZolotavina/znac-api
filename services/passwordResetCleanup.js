const User = require("../models/user");
const { resetTokenFields } = require("../utils/passwordResetToken");

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const cleanupExpiredResetTokens = (now = new Date()) =>
  User.updateMany(
    {
      $or: [
        { resetPasswordExpiresAt: { $lte: now } },
        {
          resetPasswordTokenHash: { $exists: true },
          resetPasswordExpiresAt: null,
        },
      ],
    },
    { $unset: resetTokenFields }
  );

// Recursive scheduling avoids overlapping runs; every process may safely run it.
const startPasswordResetCleanup = async () => {
  let timer;
  let stopped = false;
  const run = async () => {
    try {
      await cleanupExpiredResetTokens();
    } catch {
      console.error(
        "Password reset cleanup failed; will retry in five minutes"
      );
    } finally {
      if (!stopped) {
        timer = setTimeout(run, CLEANUP_INTERVAL_MS);
        timer.unref();
      }
    }
  };
  await run();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
};

module.exports = { cleanupExpiredResetTokens, startPasswordResetCleanup };
