const router = require('express').Router();
const { validateAddPhoto, validateDeletePhoto } = require('../middlewares/validateRequests');
const { getPhotos, addPhoto, deletePhoto } = require('../controllers/photos');

router.get('/', getPhotos);
router.post('/', validateAddPhoto, addPhoto);
router.delete('/:photoId', validateDeletePhoto, deletePhoto);

module.exports = router;
