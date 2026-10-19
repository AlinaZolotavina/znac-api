const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");

const { JWT_SECRET } = process.env;
const UnauthorizedError = require("../errors/unauthorized-err");
const { UNAUTHORIZED_ERROR_MSG } = require("../utils/constants");

const auth = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
  }
  if (!mongoose.isValidObjectId(payload._id)) {
    return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
  }
  try {
    const user = await User.findById(payload._id).select("+tokenVersion");
    // Old session cookies have implicit version 0 until the first reset.
    if (!user || (payload.tokenVersion ?? 0) !== user.tokenVersion) {
      return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
    }
    req.user = {
      _id: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = auth;
