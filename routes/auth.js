const router = require("express").Router();
const { authRateLimiter } = require("../middlewares/rateLimiter");
const {
  validateSignup,
  validateSignin,
  validateForgotPassword,
  validateResetPassword,
} = require("../middlewares/validateRequests");
const {
  createUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/users");

router.post("/signup", authRateLimiter, validateSignup, createUser);
router.post("/signin", authRateLimiter, validateSignin, login);
router.delete("/signout", authRateLimiter, logout);
router.put(
  "/forgot-password",
  authRateLimiter,
  validateForgotPassword,
  forgotPassword
);
router.put(
  "/reset-password/:resetPasswordLink",
  authRateLimiter,
  validateResetPassword,
  resetPassword
);

module.exports = router;
