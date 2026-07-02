const mongoose = require("mongoose");
const { validateHashtag } = require("../utils/validateHashtag");
const { INVALID_HASHTAG_ERROR_MSG } = require("../utils/constants");

const hashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: validateHashtag,
      message: INVALID_HASHTAG_ERROR_MSG,
    },
    minLength: 2,
    maxLength: 30,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

hashtagSchema.index({ createdAt: -1 });

module.exports = mongoose.model("hashtag", hashtagSchema);
