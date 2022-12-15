const router = require('express').Router();
const { validateAddPhoto, validatePhotoRequest } = require('../middlewares/validateRequests');
const {
  getPhotos, addPhoto, deletePhoto, increaseViews,
} = require('../controllers/photos');

router.get('/photos', getPhotos);
router.post('/photos', validateAddPhoto, addPhoto);
router.delete('/photos/:photoId', validatePhotoRequest, deletePhoto);
router.put('/photos/:photoId/views', validatePhotoRequest, increaseViews);

module.exports = router;
