const router = require('express').Router();
const { validateSignupOrSignin } = require('../middlewares/validateRequests');
const { createUser, login, logout } = require('../controllers/users');

router.post('/signup', validateSignupOrSignin, createUser);
router.post('/signin', validateSignupOrSignin, login);
router.post('/signout', logout);

module.exports = router;
