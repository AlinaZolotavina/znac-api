const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const UnauthorizedError = require('../errors/unauthorized-err');
const { UNAUTHORIZED_ERROR_MSG } = require('../utils/constants');

const auth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
  }
  req.user = payload;
  next();
  return true;
};

module.exports = auth;
