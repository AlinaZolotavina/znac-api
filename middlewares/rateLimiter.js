const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many messages. Please try again later.",
  },
});

const hashtagRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    message: "Too many hashtag updates. Please try again later.",
  },
});

module.exports = {
  rateLimiter,
  contactRateLimiter,
  hashtagRateLimiter,
};
