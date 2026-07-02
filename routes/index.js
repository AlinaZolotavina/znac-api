const router = require("express").Router();
const mongoose = require("mongoose");
const { getPhotos, findPhoto } = require("../controllers/photos");
const { uploadPhoto } = require("../controllers/upload");
const {
  getHashtags,
  addHashtag,
  updateHashtag,
} = require("../controllers/hashtags");
const { increaseViews } = require("../controllers/photos");
const { getPosts, getPost } = require("../controllers/posts");
const { getProjects, getProjectHashtags } = require("../controllers/projects");
const { contactRateLimiter } = require("../middlewares/rateLimiter");
const { sendContactMessage } = require("../controllers/contact");
const upload = require("../middlewares/upload");
const validateUploadedFiles = require("../middlewares/validateUploadedFiles");
const {
  validatePhotoRequest,
  validatePostRequest,
  validateSearch,
  validateContactMessage,
  validateAddHashtag,
  validateUpdateHashtag,
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

router.get("/photos", getPhotos);
router.post("/photos/found", validateSearch, findPhoto);
router.put("/photos/:photoId/views", validatePhotoRequest, increaseViews);

router.get("/hashtags", getHashtags);

router.get("/posts", getPosts);
router.get("/posts/:postId", validatePostRequest, getPost);
// router.delete('/hashtags', deleteHashtag);

router.get("/projects", getProjects);
router.get("/projecthashtags", getProjectHashtags);

router.post(
  "/contact",
  contactRateLimiter,
  validateContactMessage,
  sendContactMessage
);

router.use(authRouter);
router.use(auth);
router.post(
  "/public",
  upload.array("file", 10),
  validateUploadedFiles,
  uploadPhoto
);
router.post("/hashtags", validateAddHashtag, addHashtag);
router.patch("/hashtags", validateUpdateHashtag, updateHashtag);
router.use(userRouter);
router.use(photoRouter);
router.use(postRouter);
router.use(projectRouter);
router.use("/*", () => {
  throw new NotFoundError(NOT_FOUND_ERROR_MSG);
});

module.exports = router;
