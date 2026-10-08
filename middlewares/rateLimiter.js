const rateLimit = require("express-rate-limit");

const createRateLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message,
    },
  });

const getUserRateLimitKey = (req) => req.user?._id?.toString() || req.ip;

const publicReadRateLimiter = createRateLimiter(
  600,
  "Too many requests. Please try again later."
);

const protectedReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});

const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const galleryUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserRateLimitKey,
  message: {
    message: "Too many uploads. Please try again later.",
  },
});

const postImageUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserRateLimitKey,
  message: {
    message: "Too many uploads. Please try again later.",
  },
});

const heroUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserRateLimitKey,
  message: {
    message: "Too many hero uploads. Please try again later.",
  },
});

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
  galleryUploadRateLimiter,
  postImageUploadRateLimiter,
  heroUploadRateLimiter,
  viewRateLimiter,
  contactRateLimiter,
  hashtagRateLimiter,
};
