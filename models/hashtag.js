const mongoose = require("mongoose");
const { validateHashtag } = require("../utils/validateHashtag");
const {
  HASHTAG_MAX_LENGTH,
  HASHTAG_MIN_LENGTH,
  INVALID_HASHTAG_ERROR_MSG,
} = require("../utils/constants");

const hashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: validateHashtag,
      message: INVALID_HASHTAG_ERROR_MSG,
    },
    minLength: HASHTAG_MIN_LENGTH,
    maxLength: HASHTAG_MAX_LENGTH,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

hashtagSchema.index({ createdAt: -1 });
hashtagSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("hashtag", hashtagSchema);
