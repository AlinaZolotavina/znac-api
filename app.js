const express = require("express");
const path = require("path");

const cookieParser = require("cookie-parser");
const { errors } = require("celebrate");
const helmet = require("helmet");
const cors = require("cors");
const corsOptions = require("./utils/corsOptions");
const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger, errorLogger } = require("./middlewares/logger");
const { rateLimiter } = require("./middlewares/rateLimiter");
const checkOrigin = require("./middlewares/checkOrigin");

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

app.use(cors(corsOptions));

app.use(requestLogger);

app.use(helmet());

app.use(rateLimiter);

app.use(checkOrigin);

app.use(router);

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

module.exports = app;
