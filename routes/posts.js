const router = require("express").Router();
const {
  validatePostRequest,
  validateAddPost,
  validateUpdatePost,
} = require("../middlewares/validateRequests");
const {
  addPost,
  updatePost,
  deletePost,
  //   editHashtags,
} = require("../controllers/posts");

// router.get('/photos/found', findPhoto);
router.post("/posts", validateAddPost, addPost);
router.delete("/posts/:postId", validatePostRequest, deletePost);
router.patch(
  "/posts/:postId",
  validatePostRequest,
  validateUpdatePost,
  updatePost
);

module.exports = router;
