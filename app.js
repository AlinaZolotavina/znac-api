const express = require("express");
const path = require("path");

const cookieParser = require("cookie-parser");
const { errors } = require("celebrate");
const helmet = require("helmet");
// const cors = require('cors');
// const corsOptions = require('./utils/corsOptions');
const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger, errorLogger } = require("./middlewares/logger");
const { rateLimiter } = require("./middlewares/rateLimiter");
const checkOrigin = require("./middlewares/checkOrigin");

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

const app = express();

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    index: false,
    dotfiles: "deny",
    redirect: false,
  })
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    index: false,
    dotfiles: "deny",
    redirect: false,
  })
);

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(requestLogger);

app.use(helmet());

app.use(rateLimiter);

app.use(checkOrigin);

app.use(router);

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

module.exports = app;
