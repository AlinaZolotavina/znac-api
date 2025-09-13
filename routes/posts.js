const router = require('express').Router();
const { validatePostRequest } = require('../middlewares/validateRequests');
const {
  addPost,
  updatePost,
  deletePost,
//   editHashtags,
} = require('../controllers/posts');

// router.get('/photos/found', findPhoto);
router.post('/posts', addPost);
router.delete('/posts/:postId', validatePostRequest, deletePost);
router.patch('/posts/:postId', validatePostRequest, updatePost);

module.exports = router;
