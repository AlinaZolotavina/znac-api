const {
  JWT_SECRET,
  JWT_RESET_PASSWORD,
  JWT_UPDATE_EMAIL,
  NODEMAILER_USER,
} = process.env;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../utils/nodemailerTransporter');
const { resetPasswordEmailMarkup, successfullPasswordUpdateEmailMarkup, emailConfirmationEmailMarkup } = require('../utils/emailHtmlMarkup');
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
  WRONG_PASSWORD_ERROR_MSG,
  AUTHENTICATION_ERROR_MSG,
  RESET_TOKEN_ERROR_MSG,
  NO_RESET_TOKEN_ERROR_MSG,
  SUCCESSFUL_LOGOUT_MSG,
  SUCCESSFUL_EMAIL_UPDATE_MSG,
  SUCCESSFUL_PASSWORD_UPDATE_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
  EMAIL_SENT_SUCCESSFULLY_MSG,
  REQUEST_UPDATE_EMAIL_SUBJECT,
  REQUEST_UPDATE_EMAIL_TEXT,
  FORGOT_PASSWORD_SUBJECT,
  FORGOT_PASSWORD_TEXT,
  RESET_PASSWORD_SUBJECT,
  RESET_PASSWORD_TEXT,
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

const requestEmailUpdate = (req, res, next) => {
  const { email } = req.body;
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
      }
      const token = jwt.sign(
        { _id: user._id },
        JWT_UPDATE_EMAIL,
        { expiresIn: '20m' },
      );
      const data = {
        from: NODEMAILER_USER,
        to: email,
        subject: REQUEST_UPDATE_EMAIL_SUBJECT,
        text: REQUEST_UPDATE_EMAIL_TEXT,
        html: emailConfirmationEmailMarkup(token),
      };
      user.updateOne({ updateEmailLink: token })
        .then(() => {
          transporter.sendMail(data);
          res.status(200).send({ message: 'E-mail has been sent, please follow the instructions.' });
        });
    });
};

const updateEmail = (req, res, next) => {
  const userId = req.user._id;
  const { newEmail } = req.body;
  const { updateEmailLink } = req.params;
  if (!updateEmailLink) {
    next(new UnauthorizedError(AUTHENTICATION_ERROR_MSG));
  }
  jwt.verify(updateEmailLink, JWT_UPDATE_EMAIL, (error) => {
    if (error) {
      next(new UnauthorizedError(RESET_TOKEN_ERROR_MSG));
    }
    User.findByIdAndUpdate(userId, { email: newEmail, updateEmailLink: '' }, { new: true, runValidators: true })
      .then((user) => {
        if (!user) {
          return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
        }
        return res.status(200).send({ message: SUCCESSFUL_EMAIL_UPDATE_MSG });
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
  });
};

const updatePassword = (req, res, next) => {
  const { email, oldPassword, newPassword } = req.body;
  User.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
      }
      return bcrypt.compare(oldPassword, user.password)
        .then((matched) => {
          if (!matched) {
            throw new UnauthorizedError(WRONG_PASSWORD_ERROR_MSG);
          }
          bcrypt.hash(newPassword, 10)
            .then((hash) => {
              user.updateOne({ password: hash }, { new: true, runValidators: true })
                .then(() => res.status(200).send({ message: SUCCESSFUL_PASSWORD_UPDATE_MSG }));
            });
        });
    })
    .catch(next);
};

const forgotPassword = (req, res, next) => {
  const { email } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
      }
      const token = jwt.sign(
        { _id: user._id },
        JWT_RESET_PASSWORD,
        { expiresIn: '20m' },
      );
      const data = {
        from: NODEMAILER_USER,
        to: email,
        subject: FORGOT_PASSWORD_SUBJECT,
        text: FORGOT_PASSWORD_TEXT,
        html: resetPasswordEmailMarkup(token),
      };
      user.updateOne({ resetPasswordLink: token })
        .then(() => {
          transporter.sendMail(data);
          res.status(200).send({ message: EMAIL_SENT_SUCCESSFULLY_MSG });
        });
    })
    .catch(next);
};

const resetPassword = (req, res, next) => {
  const { newPassword } = req.body;
  const { resetPasswordLink } = req.params;
  if (!resetPasswordLink) {
    next(new UnauthorizedError(AUTHENTICATION_ERROR_MSG));
  }
  // eslint-disable-next-line no-unused-vars
  jwt.verify(resetPasswordLink, JWT_RESET_PASSWORD, (err, decoded) => {
    if (err) {
      return next(new UnauthorizedError(RESET_TOKEN_ERROR_MSG));
    }
    return User.findOne({ resetPasswordLink })
      .then((user) => {
        if (!user) {
          next(new NotFoundError(NO_RESET_TOKEN_ERROR_MSG));
        }
        bcrypt.hash(newPassword, 10)
          .then((hash) => {
            user.updateOne({ password: hash, resetPasswordLink: '' }, { new: true, runValidators: true })
              .then(() => {
                const data = {
                  from: NODEMAILER_USER,
                  to: user.email,
                  subject: RESET_PASSWORD_SUBJECT,
                  text: RESET_PASSWORD_TEXT,
                  html: successfullPasswordUpdateEmailMarkup,
                };
                transporter.sendMail(data);
                res.status(200).send({ message: SUCCESSFUL_PASSWORD_UPDATE_MSG });
              });
          });
      });
  })
    .catch(next);
};

module.exports = {
  createUser,
  login,
  logout,
  getMe,
  requestEmailUpdate,
  updateEmail,
  updatePassword,
  forgotPassword,
  resetPassword,
};
