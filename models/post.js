const mongoose = require("mongoose");
const isUrl = require("validator/lib/isURL");
const { IMAGE_BAD_URL_ERROR_MSG } = require("../utils/constants");

const postSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  theme: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    minLength: 2,
    maxlength: 50,
  },
  photoLink: {
    type: String,
    validate: {
      validator(v) {
        return isUrl(v, { require_tld: false });
      },
      message: IMAGE_BAD_URL_ERROR_MSG,
    },
  },
  hashtags: {
    type: String,
    required: true,
    minLength: 2,
    maxlength: 500,
  },
  text: {
    type: String,
    required: true,
    minLength: 2,
    maxlength: 5000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("post", postSchema);
