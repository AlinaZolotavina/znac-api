/* eslint-disable no-console */
const postService = require("../services/postService");
const getPagination = require("../utils/pagination");
const serializePost = require("../utils/serializePost");
const { SUCCESSFUL_POST_DELETE_MSG } = require("../utils/constants");

const getPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { data, total } = await postService.getPosts({
      skip,
      limit,
      search: req.query.search,
      theme: req.query.theme,
    });

    res.status(200).send({
      data,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

const getPost = (req, res, next) => {
  postService
    .getPost(req.params.postId)
    .then((post) => res.send(post))
    .catch(next);
};

const deletePost = (req, res, next) => {
  postService
    .deletePost({
      ownerId: req.user._id,
      postId: req.params.postId,
    })
    .then(() =>
      res.status(200).send({
        message: SUCCESSFUL_POST_DELETE_MSG,
      })
    )
    .catch(next);
};

const addPost = (req, res, next) => {
  postService
    .addPost({
      ownerId: req.user._id,
      ...req.body,
    })
    .then((post) => res.status(201).send(serializePost(post)))
    .catch(next);
};

const updatePost = (req, res, next) => {
  postService
    .updatePost({
      ownerId: req.user._id,
      postId: req.params.postId,
      ...req.body,
    })
    .then((post) => res.send(serializePost(post)))
    .catch(next);
};

module.exports = {
  getPosts,
  getPost,
  deletePost,
  addPost,
  updatePost,
};
