const Post = require("../models/post");
const normalizeHashtags = require("../utils/normalizeHashtags");
const escapeRegex = require("../utils/escapeRegex");
const NotFoundError = require("../errors/not-found-err");
const { POST_NOT_FOUND_ERROR_MSG } = require("../utils/constants");

const getPosts = async ({ skip, limit, search = "", theme = "" }) => {
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

  return {
    data: posts,
    total,
  };
};

const getPost = async (postId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
  }

  return post;
};

const addPost = ({ ownerId, theme, icon, title, photoLink, hashtags, text }) =>
  Post.create({
    owner: ownerId,
    theme,
    icon,
    title,
    photoLink,
    hashtags: normalizeHashtags(hashtags),
    text,
  });

const updatePost = ({
  ownerId,
  postId,
  newTheme,
  newIcon,
  newTitle,
  newPhotoLink,
  newHashtags,
  newText,
}) => {
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

  return Post.findOneAndUpdate(
    {
      _id: postId,
      owner: ownerId,
    },
    updateQuery,
    {
      new: true,
      runValidators: true,
    }
  ).then((post) => {
    if (!post) {
      throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
    }

    return post;
  });
};

const deletePost = ({ ownerId, postId }) =>
  Post.findOneAndDelete({
    _id: postId,
    owner: ownerId,
  }).then((post) => {
    if (!post) {
      throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
    }

    return post;
  });

module.exports = {
  getPosts,
  getPost,
  addPost,
  updatePost,
  deletePost,
};
