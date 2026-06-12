const router = require("express").Router();
const { getPhotos, findPhoto, uploadPhoto } = require("../controllers/photos");
const {
  getHashtags,
  addHashtag,
  // deleteHashtag,
  updateHashtag,
} = require("../controllers/hashtags");
const { increaseViews } = require("../controllers/photos");
const { getPosts, findPost } = require("../controllers/posts");
const {
  getProjects,
  // getProject,
  findProject,
  getProjectHashtags,
} = require("../controllers/projects");
const upload = require("../middlewares/upload");
const validateUploadedFiles = require("../middlewares/validateUploadedFiles");

const { validatePhotoRequest } = require("../middlewares/validateRequests");
const auth = require("../middlewares/auth");
const authRouter = require("./auth");
const userRouter = require("./users");
const photoRouter = require("./photos");
const postRouter = require("./posts");
const projectRouter = require("./projects");
const NotFoundError = require("../errors/not-found-err");
const { NOT_FOUND_ERROR_MSG } = require("../utils/constants");

router.get("/photos", getPhotos);
router.post("/photos/found", findPhoto);
router.put("/photos/:photoId/views", validatePhotoRequest, increaseViews);

router.get("/hashtags", getHashtags);

router.get("/posts", getPosts);
router.post("/posts/found", findPost);
// router.delete('/hashtags', deleteHashtag);

router.get("/projects", getProjects);
router.post("/projects/found", findProject);
router.get("/projecthashtags", getProjectHashtags);

router.use(authRouter);
router.use(auth);
router.post(
  "/public",
  upload.array("file", 10),
  validateUploadedFiles,
  uploadPhoto
);
router.post("/hashtags", addHashtag);
router.patch("/hashtags", updateHashtag);
router.use(userRouter);
router.use(photoRouter);
router.use(postRouter);
router.use(projectRouter);
router.use("/*", () => {
  throw new NotFoundError(NOT_FOUND_ERROR_MSG);
});

module.exports = router;
