const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;
const UnauthorizedError = require("../errors/unauthorized-err");
const { UNAUTHORIZED_ERROR_MSG } = require("../utils/constants");

const auth = (req, res, next) => {
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
  req.user = payload;
  return next();
};

module.exports = auth;
