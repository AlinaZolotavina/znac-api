const jwt = require("jsonwebtoken");

const { JWT_UPDATE_EMAIL } = process.env;

const createUpdateEmailToken = async (user, newEmail = "new@test.com") => {
  const token = jwt.sign(
    {
      _id: user._id,
      newEmail,
    },
    JWT_UPDATE_EMAIL,
    {
      expiresIn: "20m",
    }
  );

  user.updateEmailLink = token;
  await user.save();

  return token;
};

module.exports = createUpdateEmailToken;
