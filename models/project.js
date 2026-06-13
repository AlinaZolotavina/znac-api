const mongoose = require("mongoose");
const isUrl = require("validator/lib/isURL");
const { IMAGE_BAD_URL_ERROR_MSG } = require("../utils/constants");

const projectSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  title: {
    type: String,
    required: true,
    minLength: 2,
    maxlength: 50,
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
    minLength: 2,
    maxlength: 5000,
  },
  link: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return isUrl(v, { require_tld: false });
      },
      message: IMAGE_BAD_URL_ERROR_MSG,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

projectSchema.index({ owner: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ hashtags: 1 });

module.exports = mongoose.model("project", projectSchema);
