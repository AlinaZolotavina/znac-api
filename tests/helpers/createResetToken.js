const {
  createResetToken,
  hashResetToken,
  RESET_TOKEN_LIFETIME_MS,
} = require("../../utils/passwordResetToken");

const createUserResetToken = async (
  user,
  expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS)
) => {
  const token = createResetToken();
  user.resetPasswordTokenHash = hashResetToken(token);
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  return token;
};

module.exports = createUserResetToken;
