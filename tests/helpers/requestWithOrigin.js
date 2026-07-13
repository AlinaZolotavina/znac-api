const request = require("supertest");
const corsOptions = require("../../utils/corsOptions");

const unsafeMethods = new Set(["post", "put", "patch", "delete"]);
const testOrigin = process.env.CLIENT_URL || [...corsOptions.allowedOrigins][0];

const requestWithOrigin = (app) => {
  const client = request(app);

  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop];

      if (typeof value !== "function") {
        return value;
      }

      if (!unsafeMethods.has(prop)) {
        return value.bind(target);
      }

      return (...args) => value.apply(target, args).set("Origin", testOrigin);
    },
  });
};

requestWithOrigin.origin = testOrigin;

module.exports = requestWithOrigin;
