const router = require('express').Router();
const { validateAddPhoto, validatePhotoRequest } = require('../middlewares/validateRequests');
const {
  addPhoto, deletePhoto, increaseViews,
} = require('../controllers/photos');

router.post('/photos', validateAddPhoto, addPhoto);
router.delete('/photos/:photoId', validatePhotoRequest, deletePhoto);
router.put('/photos/:photoId/views', validatePhotoRequest, increaseViews);

module.exports = router;
