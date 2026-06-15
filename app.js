const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const requiredEnv = ["JWT_SECRET", "DB_URL", "CLIENT_URL"];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
});

const cookieParser = require("cookie-parser");
const { errors } = require("celebrate");
const helmet = require("helmet");
// const cors = require('cors');
// const corsOptions = require('./utils/corsOptions');
const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger, errorLogger } = require("./middlewares/logger");
const rateLimiter = require("./middlewares/rateLimiter");

const { PORT, DB_URL, CLIENT_URL } = process.env;

const app = express();

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
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

app.use(router);

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

let server;

const start = async () => {
  try {
    await mongoose.connect(DB_URL);

    console.log("MongoDB connected");

    server = app.listen(PORT, () => {
      console.log(`app listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down server...");

  try {
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }

  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
