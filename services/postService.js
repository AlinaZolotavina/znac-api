const Post = require("../models/post");
const normalizeHashtags = require("../utils/normalizeHashtags");
const escapeRegex = require("../utils/escapeRegex");
const serializePost = require("../utils/serializePost");
const resolvePostPhotoPath = require("../utils/resolvePostPhotoPath");
const fs = require("fs").promises;
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
    data: posts.map(serializePost),
    total,
  };
};

const getPost = async (postId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
  }

  return serializePost(post);
};

const addPost = ({
  ownerId,
  theme,
  icon,
  title,
  photoLink,
  photoFilename,
  hashtags,
  text,
}) =>
  Post.create({
    owner: ownerId,
    theme,
    icon,
    title,
    photoLink,
    photoFilename,
    hashtags: normalizeHashtags(hashtags),
    text,
  });

const updatePost = async ({
  ownerId,
  postId,
  newTheme,
  newIcon,
  newTitle,
  newPhotoLink,
  newPhotoFilename,
  removePhoto,
  newHashtags,
  newText,
}) => {
  const post = await Post.findOne({
    _id: postId,
    owner: ownerId,
  });

  if (!post) {
    throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
  }

  const shouldDeleteOldFile =
    !!post.photoFilename && (removePhoto || newPhotoFilename || newPhotoLink);
  const oldFilePath = shouldDeleteOldFile ? resolvePostPhotoPath(post) : null;

  console.log({
    shouldDeleteOldFile,
    oldFilePath,
    removePhoto,
    newPhotoFilename,
    newPhotoLink,
    currentFilename: post.photoFilename,
  });

  post.theme = newTheme;
  post.icon = newIcon;
  post.title = newTitle;
  post.hashtags = normalizeHashtags(newHashtags);
  post.text = newText;

  if (removePhoto) {
    post.photoLink = undefined;
    post.photoFilename = undefined;
  } else if (newPhotoFilename) {
    post.photoFilename = newPhotoFilename;
    post.photoLink = undefined;
  } else if (newPhotoLink) {
    post.photoLink = newPhotoLink;
    post.photoFilename = undefined;
  }

  await post.save();

  if (oldFilePath) {
    console.log("Deleting:", oldFilePath);
    try {
      await fs.unlink(oldFilePath);
    } catch (err) {
      console.error(`Failed to delete file ${oldFilePath}:`, err.message);
    }
  }

  return post;
};

const deletePost = async ({ ownerId, postId }) => {
  const post = await Post.findOneAndDelete({
    _id: postId,
    owner: ownerId,
  });

  if (!post) {
    throw new NotFoundError(POST_NOT_FOUND_ERROR_MSG);
  }

  const filePath = resolvePostPhotoPath(post);

  if (filePath) {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err.message);
    }
  }

  return post;
};

module.exports = {
  getPosts,
  getPost,
  addPost,
  updatePost,
  deletePost,
};
