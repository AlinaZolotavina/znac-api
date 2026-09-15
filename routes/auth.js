const router = require("express").Router();
const { authRateLimiter } = require("../middlewares/rateLimiter");
const {
  // validateSignup,
  validateSignin,
  validateForgotPassword,
  validateResetPassword,
} = require("../middlewares/validateRequests");
const {
  // createUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/users");

// router.post("/signup", validateSignup, createUser);
router.post("/signup", authRateLimiter, (req, res) => {
  return res.status(403).send({
    message: "User registration is disabled",
  });
});
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
