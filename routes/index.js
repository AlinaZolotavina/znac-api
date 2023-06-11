const router = require('express').Router();
const { getPhotos, findPhoto, uploadPhoto } = require('../controllers/photos');
const {
  getHashtags,
  addHashtag,
  // deleteHashtag,
  updateHashtag,
} = require('../controllers/hashtags');
const { increaseViews } = require('../controllers/photos');
const { validatePhotoRequest } = require('../middlewares/validateRequests');
const auth = require('../middlewares/auth');
const authRouter = require('./auth');
const userRouter = require('./users');
const photoRouter = require('./photos');
const NotFoundError = require('../errors/not-found-err');
const { NOT_FOUND_ERROR_MSG } = require('../utils/constants');

router.get('/photos', getPhotos);
router.post('/photos/found', findPhoto);
router.post('/public', uploadPhoto);
router.get('/hashtags', getHashtags);
router.post('/hashtags', addHashtag);
// router.delete('/hashtags', deleteHashtag);
router.patch('/hashtags', updateHashtag);
router.put('/photos/:photoId/views', validatePhotoRequest, increaseViews);
router.use(authRouter);
router.use(auth);
router.use(userRouter);
router.use(photoRouter);
router.use('/*', () => {
  throw new NotFoundError(NOT_FOUND_ERROR_MSG);
});

module.exports = router;
