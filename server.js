require("dotenv").config();

const mongoose = require("mongoose");

const app = require("./app");

const { PORT, DB_URL } = process.env;

const requiredEnv = ["JWT_SECRET", "DB_URL", "CLIENT_URL"];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
});

let server;

const start = async () => {
  try {
    await mongoose.connect(DB_URL);

    console.log("MongoDB connected");

    server = app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
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
