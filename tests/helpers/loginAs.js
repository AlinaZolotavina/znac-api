const login = require("./login");

const loginAs = (email) =>
  login({
    email,
    password: "12345678",
  });

module.exports = loginAs;
