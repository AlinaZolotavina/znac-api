const router = require('express').Router();
const { validateAddPhoto, validatePhotoRequest } = require('../middlewares/validateRequests');
const {
  addPhoto, deletePhoto, increaseViews, editHashtags,
} = require('../controllers/photos');

router.post('/photos', validateAddPhoto, addPhoto);
router.delete('/photos/:photoId', validatePhotoRequest, deletePhoto);
router.put('/photos/:photoId/views', validatePhotoRequest, increaseViews);
router.patch('/photos/:photoId/hashtags', validatePhotoRequest, editHashtags);

module.exports = router;
