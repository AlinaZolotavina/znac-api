const router = require('express').Router();
const { validateSignupOrSignin } = require('../middlewares/validateRequests');
const {
  createUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/users');

router.post('/signup', validateSignupOrSignin, createUser);
router.post('/signin', validateSignupOrSignin, login);
router.post('/signout', logout);
router.put('/forgot-password', forgotPassword);
router.put('/reset-password/:resetPasswordLink', resetPassword);

module.exports = router;
