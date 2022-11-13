const router = require('express').Router();
const auth = require('../middlewares/auth');
const authRouter = require('./auth');
const userRouter = require('./users');
const photoRouter = require('./photos');
const NotFoundError = require('../errors/not-found-err');
const { NOT_FOUND_ERROR_MSG } = require('../utils/constants');

router.use(authRouter);
router.use(auth);
router.use(userRouter);
router.use(photoRouter);
router.use('/*', () => {
  throw new NotFoundError(NOT_FOUND_ERROR_MSG);
});

module.exports = router;
