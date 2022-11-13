const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const NotFoundError = require('../errors/not-found-err');
const ConflictError = require('../errors/conflict-err');
const BadRequestError = require('../errors/bad-request-err');
const UnauthorizedError = require('../errors/unauthorized-err');

const {
  CONFLICT_SIGNUP_EMAIL_ERROR_MSG,
  BAD_REQUEST_ERROR_MSG,
  SUCCESSFUL_LOGIN_MSG,
  TOKEN_ERROR_MSG,
  USER_NOT_FOUND_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  SUCCESSFUL_LOGOUT_MSG,
  SUCCESSFUL_PROFILE_UPDATE_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
} = require('../utils/constants');

const User = require('../models/user');

const createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, email, password: hash,
    }))
    .then((user) => res.status(201).send({
      user: {
        _id: user._id,
        email: user.email,
      },
    }))
    .catch((err) => {
      if (err.name === 'MongoServerError' || err.code === 11000) {
        return next(new ConflictError(CONFLICT_SIGNUP_EMAIL_ERROR_MSG));
      }
      if (err.name === 'ValidationError' || err.name === 'CastError') {
        return next(new BadRequestError(BAD_REQUEST_ERROR_MSG));
      }
      return next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        JWT_SECRET,
        { expiresIn: '7d' },
      );
      res
        .cookie('jwt', token, {
          maxAge: 3600000 * 24 * 7,
          httpOnly: true,
        })
        .send({
          user: {
            _id: user._id,
            email: user.email,
          },
          message: SUCCESSFUL_LOGIN_MSG,
        });
    })
    .catch(next);
};

const logout = (req, res, next) => {
  const { email } = req.body;
  const token = req.cookies.jwt;

  if (!token) {
    return new UnauthorizedError(TOKEN_ERROR_MSG);
  }

  let verifiedUser;
  return User.findOne({ email })
    .then((user) => {
      if (!user) {
        return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
      }
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
        }
        verifiedUser = decoded;
        if (user._id.toHexString() !== verifiedUser._id) {
          return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
        }
        return res
          .clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
          })
          .send({ message: SUCCESSFUL_LOGOUT_MSG });
      });
      return true;
    })
    .catch(next);
};

const getMe = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
      }
      return res.send(user);
    })
    .catch(next);
};

const updateUserEmail = (req, res, next) => {
  const userId = req.user._id;
  const { email } = req.body;
  User.findByIdAndUpdate(userId, { email }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
      }
      return res.status(200).send({ user, message: SUCCESSFUL_PROFILE_UPDATE_MSG });
    })
    .catch((err) => {
      if (err.name === 'MongoServerError' || err.code === 11000) {
        return next(new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG));
      }
      if (err.name === 'ValidationError' || err.name === 'CastError') {
        return next(new BadRequestError(BAD_REQUEST_ERROR_MSG));
      }
      return next(err);
    });
};

module.exports = {
  createUser,
  login,
  logout,
  getMe,
  updateUserEmail,
};
