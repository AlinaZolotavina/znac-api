const rateLimit = require("express-rate-limit");

const createRateLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    message: {
      message,
    },
  });

const publicReadRateLimiter = createRateLimiter(
  600,
  "Too many requests. Please try again later."
);

const protectedReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const authRateLimiter = createRateLimiter(
  20,
  "Too many authentication attempts. Please try again later."
);

const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const uploadRateLimiter = createRateLimiter(
  30,
  "Too many uploads. Please try again later."
);

const viewRateLimiter = createRateLimiter(
  300,
  "Too many view updates. Please try again later."
);

const contactRateLimiter = createRateLimiter(
  5,
  "Too many messages. Please try again later."
);

const hashtagRateLimiter = createRateLimiter(
  30,
  "Too many hashtag updates. Please try again later."
);

module.exports = {
  publicReadRateLimiter,
  protectedReadRateLimiter,
  authRateLimiter,
  writeRateLimiter,
  uploadRateLimiter,
  viewRateLimiter,
  contactRateLimiter,
  hashtagRateLimiter,
};
