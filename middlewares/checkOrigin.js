const { FORBIDDEN_ORIGIN_ERROR_MSG } = require("../utils/constants");

const allowedOrigins = new Set([process.env.CLIENT_URL]);

const safeMethods = ["GET", "HEAD", "OPTIONS"];

const checkOrigin = (req, res, next) => {
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  // Разрешаем запросы без Origin (Postman, curl).
  if (!origin) {
    return next();
  }

  if (!allowedOrigins.has(origin)) {
    console.warn(
      `Blocked ${req.method} ${req.originalUrl} from origin: ${origin}`
    );

    return res.status(403).send({
      message: FORBIDDEN_ORIGIN_ERROR_MSG,
    });
  }

  return next();
};

module.exports = checkOrigin;
