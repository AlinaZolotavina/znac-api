const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const requiredEnv = ["JWT_SECRET", "DB_URL"];

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

const { PORT } = require("./utils/config");
const { DB_URL } = process.env;

const app = express();

app.use(
  fileUpload({
    createParentPath: false,
    uploadTimeout: 60000,
    abortOnLimit: true,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 1,
    },
  })
);

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use((req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin', 'https://znac.org');
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`app listening on port ${PORT}`);
});
