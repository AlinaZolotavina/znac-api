const router = require('express').Router();
const { validatePhotoRequest } = require('../middlewares/validateRequests');
const {
  addPhoto,
  deletePhoto,
  editHashtags,
} = require('../controllers/photos');

// router.get('/photos/found', findPhoto);
router.post('/photos', addPhoto);
router.delete('/photos/:photoId', validatePhotoRequest, deletePhoto);
router.patch('/photos/:photoId/hashtags', validatePhotoRequest, editHashtags);

module.exports = router;
