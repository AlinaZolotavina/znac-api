const bcrypt = require("bcryptjs");
const User = require("../../models/user");

const createUser = async (overrides = {}) => {
  const password = await bcrypt.hash("12345678", 10);

  return User.create({
    email: "alina@test.com",
    password,
    ...overrides,
  });
};

module.exports = createUser;
