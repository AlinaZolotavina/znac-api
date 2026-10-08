const router = require("express").Router();
const mongoose = require("mongoose");
const { getPhotos, findPhoto } = require("../controllers/photos");
const { uploadPhoto } = require("../controllers/upload");
const { getHashtags } = require("../controllers/hashtags");
const { increaseViews } = require("../controllers/photos");
const { getPosts, getPost } = require("../controllers/posts");
const { getProjects, getProjectHashtags } = require("../controllers/projects");
const {
  getSettings,
  updateHeroImage,
  updateSignupSettings,
  updateAccentColor,
} = require("../controllers/siteSettings");
const {
  publicReadRateLimiter,
  writeRateLimiter,
  galleryUploadRateLimiter,
  postImageUploadRateLimiter,
  heroUploadRateLimiter,
  viewRateLimiter,
  contactRateLimiter,
} = require("../middlewares/rateLimiter");
const { sendContactMessage } = require("../controllers/contact");
const setUploadType = require("../middlewares/setUploadType");
const adminOnly = require("../middlewares/adminOnly");
const createUpload = require("../middlewares/upload");
const galleryUpload = createUpload("gallery");
const postUpload = createUpload("posts");
const heroUpload = createUpload("heroes");
const validateUploadedFiles = require("../middlewares/validateUploadedFiles");
const createThumbnails = require("../middlewares/createThumbnails");
const {
  validatePhotoRequest,
  validatePostRequest,
  validateSearch,
  validateContactMessage,
  validateHeroSlot,
  validateSignupSettings,
  validateAccentColorSettings,
} = require("../middlewares/validateRequests");
const auth = require("../middlewares/auth");
const authRouter = require("./auth");
const userRouter = require("./users");
const photoRouter = require("./photos");
const postRouter = require("./posts");
const projectRouter = require("./projects");
const NotFoundError = require("../errors/not-found-err");
const { NOT_FOUND_ERROR_MSG } = require("../utils/constants");

router.get("/health", (req, res) => {
  res.status(200).send({
    status: "ok",
  });
});

router.get("/ready", (req, res) => {
  const isReady = mongoose.connection.readyState === 1;

  return res.status(isReady ? 200 : 503).send({
    status: isReady ? "ready" : "not ready",
    mongoState: mongoose.connection.readyState,
  });
});

router.get("/photos", publicReadRateLimiter, getPhotos);
router.post("/photos/found", publicReadRateLimiter, validateSearch, findPhoto);
router.put(
  "/photos/:photoId/views",
  viewRateLimiter,
  validatePhotoRequest,
  increaseViews
);

router.get("/hashtags", publicReadRateLimiter, getHashtags);

router.get("/posts", publicReadRateLimiter, getPosts);
router.get(
  "/posts/:postId",
  publicReadRateLimiter,
  validatePostRequest,
  getPost
);

router.get("/projects", publicReadRateLimiter, getProjects);
router.get("/projecthashtags", publicReadRateLimiter, getProjectHashtags);
router.get("/settings", publicReadRateLimiter, getSettings);

router.post(
  "/contact",
  contactRateLimiter,
  validateContactMessage,
  sendContactMessage
);

router.use(authRouter);

router.use(auth);

router.patch(
  "/settings/heroes/:slot",
  adminOnly,
  heroUploadRateLimiter,
  validateHeroSlot,
  setUploadType("heroes"),
  heroUpload.single("image"),
  validateUploadedFiles,
  updateHeroImage
);

router.patch(
  "/settings/auth/signup",
  adminOnly,
  validateSignupSettings,
  updateSignupSettings
);

router.patch(
  "/settings/colors/accent",
  adminOnly,
  validateAccentColorSettings,
  updateAccentColor
);

router.post(
  "/posts/image",
  postImageUploadRateLimiter,
  setUploadType("posts"),
  postUpload.array("images", 10),
  validateUploadedFiles,
  createThumbnails("posts"),
  uploadPhoto
);

router.post(
  "/upload",
  galleryUploadRateLimiter,
  setUploadType("gallery"),
  galleryUpload.array("photos", 10),
  validateUploadedFiles,
  createThumbnails("gallery"),
  uploadPhoto
);

router.use(writeRateLimiter);

router.use(userRouter);
router.use(photoRouter);
router.use(postRouter);
router.use(projectRouter);
router.use("/*", () => {
  throw new NotFoundError(NOT_FOUND_ERROR_MSG);
});

module.exports = router;
