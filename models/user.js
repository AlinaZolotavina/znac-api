const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const isEmail = require("validator/lib/isEmail");
const UnauthorizedError = require("../errors/unauthorized-err");
const {
  BAD_EMAIL_ERROR_MSG,
  WRONG_EMAIL_OR_PASSWORD_ERROR_MSG,
} = require("../utils/constants");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
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
  resetPasswordTokenHash: {
    type: String,
    select: false,
    index: true,
  },
  resetPasswordExpiresAt: {
    type: Date,
    select: false,
    index: true,
  },
  tokenVersion: {
    type: Number,
    default: 0,
    select: false,
  },
  pendingEmail: { type: String, select: false },
  emailChangeCurrentEmail: { type: String, select: false },
  emailChangeRequestId: { type: String, select: false },
  emailChangeTokenVersion: { type: Number, select: false },
  emailChangeExpiresAt: { type: Date, select: false, index: true },
  emailChangeOldTokenHash: { type: String, select: false },
  emailChangeNewTokenHash: { type: String, select: false },
  emailChangeOldConfirmed: { type: Boolean, select: false },
  emailChangeNewConfirmed: { type: Boolean, select: false },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
});

// Only public profile fields may leave the API, including for older documents.
userSchema.set("toJSON", {
  transform: (_doc, result) => ({
    _id: result._id,
    email: result.email,
    role: result.role,
  }),
});

userSchema.statics.findUserByCredentials = function findUser(email, password) {
  return this.findOne({ email })
    .collation({ locale: "en", strength: 2 })
    .select("+password +tokenVersion")
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError(WRONG_EMAIL_OR_PASSWORD_ERROR_MSG);
      }
      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          throw new UnauthorizedError(WRONG_EMAIL_OR_PASSWORD_ERROR_MSG);
        }
        return user;
      });
    });
};

module.exports = mongoose.model("user", userSchema);
