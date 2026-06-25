/* eslint-disable no-console */
// const fs = require("fs");
const Post = require("../models/post");
const getPagination = require("../utils/pagination");
const NotFoundError = require("../errors/not-found-err");
const escapeRegex = require("../utils/escapeRegex");
const normalizeHashtags = require("../utils/normalizeHashtags");
const {
  POST_NOT_FOUND_ERROR_MSG,
  SUCCESSFUL_POST_DELETE_MSG,
} = require("../utils/constants");

const getPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { search = "", theme = "" } = req.query;
    const filters = [];

    if (theme && theme !== "All") {
      filters.push({ theme });
    }

    if (search.trim()) {
      const searchTerm = escapeRegex(search.trim());

      filters.push({
        $or: [
          { theme: { $regex: searchTerm, $options: "i" } },
          { title: { $regex: searchTerm, $options: "i" } },
          { text: { $regex: searchTerm, $options: "i" } },
          { hashtags: search.trim().toLowerCase() },
        ],
      });
    }

    const query = filters.length > 0 ? { $and: filters } : {};

    const [posts, total] = await Promise.all([
      Post.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Post.countDocuments(query),
    ]);
    return res.status(200).send({
      data: posts,
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
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
      }
      res.send(post);
    })
    .catch(next);
};

const deletePost = (req, res, next) => {
  const { postId } = req.params;

  Post.findOneAndDelete({
    _id: postId,
    owner: req.user._id,
  })
    .then((post) => {
      if (!post) {
        throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
      }

      res.status(200).send({
        message: SUCCESSFUL_POST_DELETE_MSG,
      });
    })
    .catch(next);
};

const addPost = (req, res, next) => {
  const { theme, icon, title, photoLink, hashtags, text } = req.body;
  const hashtagsArray = normalizeHashtags(hashtags);
  Post.create({
    owner: req.user._id,
    theme,
    icon,
    title,
    photoLink,
    hashtags: hashtagsArray,
    text,
  })
    .then((post) => res.status(201).send(post))
    .catch(next);
};

const updatePost = (req, res, next) => {
  const { postId } = req.params;
  const { newTheme, newIcon, newTitle, newPhotoLink, newHashtags, newText } =
    req.body;

  const updateData = {
    theme: newTheme,
    icon: newIcon,
    title: newTitle,
    hashtags: normalizeHashtags(newHashtags),
    text: newText,
  };

  const updateQuery = newPhotoLink
    ? { ...updateData, photoLink: newPhotoLink }
    : {
        $set: updateData,
        $unset: { photoLink: 1 },
      };

  Post.findOneAndUpdate(
    {
      _id: postId,
      owner: req.user._id,
    },
    updateQuery,
    {
      new: true,
      runValidators: true,
    }
  )
    .then((post) => {
      if (!post) {
        throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
      }

      res.status(200).send(post);
    })
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

// const editHashtags = (req, res, next) => {
//   const { photoId } = req.params;
//   const { newHashtags } = req.body;
//   Photo.findByIdAndUpdate(photoId, { hashtags: newHashtags }, { new: true, runValidators: true })
//     .then((photo) => {
//       if (!photo) {
//         return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
//       }
//       return res.send(photo);
//     })
//     .catch(next);
// };

module.exports = {
  getPosts,
  getPost,
  deletePost,
  addPost,
  updatePost,
  uploadPostPhoto,
  //   editHashtags,
};
