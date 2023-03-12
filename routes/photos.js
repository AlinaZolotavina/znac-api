const router = require('express').Router();
const { validateAddPhoto, validatePhotoRequest } = require('../middlewares/validateRequests');
const {
  addPhoto, deletePhoto, editHashtags,
} = require('../controllers/photos');

// router.get('/photos/found', findPhoto);
router.post('/photos', validateAddPhoto, addPhoto);
router.delete('/photos/:photoId', validatePhotoRequest, deletePhoto);
router.patch('/photos/:photoId/hashtags', validatePhotoRequest, editHashtags);

module.exports = router;
