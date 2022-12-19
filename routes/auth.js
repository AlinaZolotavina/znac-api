const router = require('express').Router();
const { validateSignup, validateSignin } = require('../middlewares/validateRequests');
const {
  createUser,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/users');

router.post('/signup', validateSignup, createUser);
router.post('/signin', validateSignin, login);
router.delete('/signout', logout);
router.put('/forgot-password', forgotPassword);
router.put('/reset-password/:resetPasswordLink', resetPassword);

module.exports = router;
