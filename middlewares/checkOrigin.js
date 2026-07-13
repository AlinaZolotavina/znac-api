const { FORBIDDEN_ORIGIN_ERROR_MSG } = require("../utils/constants");
const corsOptions = require("../utils/corsOptions");

const safeMethods = ["GET", "HEAD", "OPTIONS"];
const publicUnsafeRoutes = [
  { method: "POST", path: /^\/photos\/found$/ },
  { method: "PUT", path: /^\/photos\/[^/]+\/views$/ },
  { method: "POST", path: /^\/hashtags$/ },
  { method: "PATCH", path: /^\/hashtags$/ },
  { method: "POST", path: /^\/contact$/ },
];

const isPublicUnsafeRoute = (req) =>
  publicUnsafeRoutes.some(
    ({ method, path }) => req.method === method && path.test(req.path)
  );

const rejectOrigin = (req, res, origin = "missing") => {
  console.warn(
    `Blocked ${req.method} ${req.originalUrl} from origin: ${origin}`
  );

  return res.status(403).send({
    message: FORBIDDEN_ORIGIN_ERROR_MSG,
  });
};

const checkOrigin = (req, res, next) => {
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin) {
    if (isPublicUnsafeRoute(req)) {
      return next();
    }

    return rejectOrigin(req, res);
  }

  if (!corsOptions.isAllowedOrigin(origin)) {
    return rejectOrigin(req, res, origin);
  }

  return next();
};

module.exports = checkOrigin;
