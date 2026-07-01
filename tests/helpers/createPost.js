const Post = require("../../models/post");

const createPost = async (ownerId, overrides = {}) =>
  Post.create({
    owner: ownerId,
    theme: "Backend",
    icon: "💻",
    title: "Node.js",
    photoLink: "https://example.com/photo.jpg",
    hashtags: ["node", "express"],
    text: "Post text",
    ...overrides,
  });

module.exports = createPost;
