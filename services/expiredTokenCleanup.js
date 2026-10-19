const User = require("../models/user");
const {
  resetTokenFields,
  emailChangeFields,
} = require("../utils/securityTokens");

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const cleanupExpiredTokens = async (now = new Date()) => {
  const results = await Promise.allSettled([
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
    ),
    User.updateMany(
      {
        $or: [
          { emailChangeExpiresAt: { $lte: now } },
          { pendingEmail: { $exists: true }, emailChangeExpiresAt: null },
        ],
      },
      { $unset: emailChangeFields }
    ),
  ]);
  if (results.some((result) => result.status === "rejected"))
    throw new Error("Expired token cleanup failed");
};

// Recursive scheduling avoids overlapping runs; every process may safely run it.
const startExpiredTokenCleanup = async () => {
  let timer;
  let stopped = false;
  const run = async () => {
    try {
      await cleanupExpiredTokens();
    } catch {
      console.error("Expired token cleanup failed; will retry in five minutes");
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

module.exports = { cleanupExpiredTokens, startExpiredTokenCleanup };
