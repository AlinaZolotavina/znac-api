const defaultAllowedOrigins = ["http://localhost:3000"];

const allowedOrigins = new Set(
  (process.env.CLIENT_URL || defaultAllowedOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const isAllowedOrigin = (origin) => allowedOrigins.has(origin);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, false);
    }

    return callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  optionsSuccessStatus: 200,
};

corsOptions.allowedOrigins = allowedOrigins;
corsOptions.isAllowedOrigin = isAllowedOrigin;

module.exports = corsOptions;
