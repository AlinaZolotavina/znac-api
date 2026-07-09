const router = require("express").Router();
const {
  validatePhotoRequest,
  validateAddPhoto,
  validatePhotoHashtags,
} = require("../middlewares/validateRequests");
const {
  addPhoto,
  deletePhoto,
  editHashtags,
} = require("../controllers/photos");

router.post("/photos", validateAddPhoto, addPhoto);
router.delete("/photos/:photoId", validatePhotoRequest, deletePhoto);
router.patch(
  "/photos/:photoId/hashtags",
  validatePhotoRequest,
  validatePhotoHashtags,
  editHashtags
);

module.exports = router;
