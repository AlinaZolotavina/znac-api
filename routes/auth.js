const router = require("express").Router();
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
router.post("/signup", (req, res) => {
  return res.status(403).send({
    message: "User registration is disabled",
  });
});
router.post("/signin", validateSignin, login);
router.delete("/signout", logout);
router.put("/forgot-password", validateForgotPassword, forgotPassword);
router.put(
  "/reset-password/:resetPasswordLink",
  validateResetPassword,
  resetPassword
);

module.exports = router;
