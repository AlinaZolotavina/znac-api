const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: "There are too many requests! Serever is tired :(",
});

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many messages. Please try again later.",
  },
});

module.exports = {
  rateLimiter,
  contactRateLimiter,
};
