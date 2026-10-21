const mongoose = require("mongoose");
const isUrl = require("validator/lib/isURL");
const { IMAGE_BAD_URL_ERROR_MSG, POST_THEMES } = require("../utils/constants");

const postSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  theme: {
    type: String,
    required: true,
    enum: POST_THEMES,
  },
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    minLength: 2,
    maxlength: 70,
  },
  photoFilename: {
    type: String,
  },
  photoLink: {
    type: String,
    validate: {
      validator(v) {
        return !v || isUrl(v, { require_tld: false });
      },
      message: IMAGE_BAD_URL_ERROR_MSG,
    },
  },
  externalLink: {
    type: String,
    required: false,
    set: (value) => (value === "" || value === null ? undefined : value),
    validate: {
      validator(v) {
        return !v || isUrl(v, { require_tld: false });
      },
      message: IMAGE_BAD_URL_ERROR_MSG,
    },
  },
  externalLinkButtonText: {
    type: String,
    required: false,
    trim: true,
    minLength: 1,
    maxlength: 40,
  },
  hashtags: [
    {
      type: String,
      lowercase: true,
      trim: true,
    },
  ],
  text: {
    type: String,
    required: true,
    minLength: 1,
    maxlength: 6000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

postSchema.index({ owner: 1 });
postSchema.index({ theme: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });

postSchema.pre("validate", function (next) {
  if (!this.externalLink) {
    this.externalLink = undefined;
    this.externalLinkButtonText = undefined;
  } else if (!this.externalLinkButtonText) {
    this.externalLinkButtonText = undefined;
  }

  if (this.photoLink && this.photoFilename) {
    this.invalidate(
      "photoFilename",
      "Only one of photoLink or photoFilename can be specified"
    );
  }

  next();
});

module.exports = mongoose.model("post", postSchema);
