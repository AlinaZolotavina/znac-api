/* eslint-disable no-console */
const postService = require("../services/postService");
const getPagination = require("../utils/pagination");
const NotFoundError = require("../errors/not-found-err");
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
    .then((post) => res.status(201).send(post))
    .catch(next);
};

const updatePost = (req, res, next) => {
  postService
    .updatePost({
      ownerId: req.user._id,
      postId: req.params.postId,
      ...req.body,
    })
    .then((post) => res.send(post))
    .catch(next);
};

const uploadPostPhoto = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new NotFoundError("No post photo to upload"));
  }
  const { file } = req.files;
  const filePath = `${process.env.API_URL}public/${file.name}`;
  return file
    .mv(`./public/${file.name}`)
    .then(() => {
      res.status(200).send({
        status: true,
        message: "Post photo is uploaded",
        data: {
          name: file.name,
          size: file.size,
          path: filePath,
        },
      });
    })
    .catch(next);
};

module.exports = {
  getPosts,
  getPost,
  deletePost,
  addPost,
  updatePost,
  uploadPostPhoto,
};
