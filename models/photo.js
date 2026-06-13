const mongoose = require("mongoose");
const isUrl = require("validator/lib/isURL");
const { IMAGE_BAD_URL_ERROR_MSG } = require("../utils/constants");

const photoSchema = new mongoose.Schema({
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  hashtags: [
    {
      type: String,
      lowercase: true,
      trim: true,
    },
  ],
  views: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

photoSchema.index({ owner: 1 });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ hashtags: 1 });

module.exports = mongoose.model("photo", photoSchema);
