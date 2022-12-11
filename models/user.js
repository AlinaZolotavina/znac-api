const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');
const UnauthorizedError = require('../errors/unauthorized-err');
const {
  BAD_EMAIL_ERROR_MSG,
  WRONG_EMAIL_OR_PASSWORD_ERROR_MSG,
} = require('../utils/constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => isEmail(v),
      message: BAD_EMAIL_ERROR_MSG,
    },
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    select: false,
  },
  resetPasswordLink: {
    data: String,
    default: '',
  },
  updateEmailLink: {
    data: String,
    default: '',
  },
});

userSchema.statics.findUserByCredentials = function findUser(email, password) {
  return this.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError(WRONG_EMAIL_OR_PASSWORD_ERROR_MSG);
      }
      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new UnauthorizedError(WRONG_EMAIL_OR_PASSWORD_ERROR_MSG);
          }
          return user;
        });
    });
};

module.exports = mongoose.model('user', userSchema);
