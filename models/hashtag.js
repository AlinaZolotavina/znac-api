const mongoose = require('mongoose');
const { validateHashtag } = require('../utils/validateHashtag');

const hashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return validateHashtag(v);
      },
      message: 'Only letters, numbers and underscores are allowed for hashtags',
    },
    minLength: 2,
    maxLength: 30,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('hashtag', hashtagSchema);
