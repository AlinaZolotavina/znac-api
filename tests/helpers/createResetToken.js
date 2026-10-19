const {
  createToken,
  hashToken,
  TOKEN_LIFETIME_MS,
} = require("../../utils/securityTokens");

const createUserResetToken = async (
  user,
  expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS)
) => {
  const token = createToken();
  user.resetPasswordTokenHash = hashToken(token);
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  return token;
};

module.exports = createUserResetToken;
