const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

const connect = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
};

const disconnect = async () => {
  await mongoose.disconnect();
  await mongo.stop();
};

module.exports = {
  connect,
  disconnect,
};
