const winston = require("winston");
const expressWinston = require("express-winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { redactSecrets } = require("../utils/redactSecrets");

const safeLogFormat = () =>
  winston.format.combine(
    winston.format((info) => redactSecrets(info))(),
    winston.format.json()
  );

const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const requestLogger = expressWinston.logger({
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, "request-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "14d",
    }),
  ],
  format: safeLogFormat(),
});

const errorLogger = expressWinston.errorLogger({
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "14d",
    }),
  ],
  format: safeLogFormat(),
});

module.exports = {
  requestLogger,
  errorLogger,
};
