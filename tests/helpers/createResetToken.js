const jwt = require("jsonwebtoken");

const { JWT_RESET_PASSWORD } = process.env;

const createResetToken = async (user) => {
  const token = jwt.sign({ _id: user._id }, JWT_RESET_PASSWORD, {
    expiresIn: "20m",
  });

  user.resetPasswordLink = token;
  await user.save();

  return token;
};

module.exports = createResetToken;
