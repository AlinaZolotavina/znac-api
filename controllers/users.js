const userService = require("../services/userService");

const {
  SUCCESSFUL_LOGIN_MSG,
  SUCCESSFUL_LOGOUT_MSG,
  SUCCESSFUL_EMAIL_UPDATE_MSG,
  SUCCESSFUL_PASSWORD_UPDATE_MSG,
  EMAIL_SENT_SUCCESSFULLY_MSG,
} = require("../utils/constants");

// Registration
const createUser = (req, res, next) => {
  userService
    .createUser(req.body)
    .then((user) =>
      res.status(201).send({
        user: {
          _id: user._id,
          email: user.email,
        },
      })
    )
    .catch(next);
};

// Authentication
const login = (req, res, next) => {
  userService
    .login(req.body)
    .then(({ user, token }) =>
      res
        .cookie("jwt", token, {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })
        .send({
          user: {
            _id: user._id,
            email: user.email,
          },
          message: SUCCESSFUL_LOGIN_MSG,
        })
    )
    .catch(next);
};

const logout = (req, res, next) => {
  Promise.resolve()
    .then(() => userService.logout(req.cookies.jwt))
    .then(() =>
      res
        .clearCookie("jwt", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        })
        .send({
          message: SUCCESSFUL_LOGOUT_MSG,
        })
    )
    .catch(next);
};

// Profile
const getMe = (req, res, next) => {
  userService
    .getMe(req.user._id)
    .then((user) => res.send(user))
    .catch(next);
};

const updatePassword = (req, res, next) => {
  userService
    .updatePassword({
      userId: req.user._id,
      ...req.body,
    })
    .then(() =>
      res.status(200).send({
        message: SUCCESSFUL_PASSWORD_UPDATE_MSG,
      })
    )
    .catch(next);
};

const requestEmailUpdate = (req, res, next) => {
  userService
    .requestEmailUpdate({
      userId: req.user._id,
      newEmail: req.body.newEmail,
    })
    .then(() =>
      res.status(200).send({
        message: EMAIL_SENT_SUCCESSFULLY_MSG,
      })
    )
    .catch(next);
};

// Password reset
const updateEmail = (req, res, next) => {
  userService
    .updateEmail(req.params.updateEmailLink)
    .then((user) =>
      res.status(200).send({
        message: SUCCESSFUL_EMAIL_UPDATE_MSG,
        user,
      })
    )
    .catch(next);
};

const forgotPassword = (req, res, next) => {
  userService
    .forgotPassword(req.body.email)
    .then(() =>
      res.status(200).send({
        message: EMAIL_SENT_SUCCESSFULLY_MSG,
      })
    )
    .catch(next);
};

const resetPassword = (req, res, next) => {
  userService
    .resetPassword({
      resetPasswordLink: req.params.resetPasswordLink,
      ...req.body,
    })
    .then(() =>
      res.status(200).send({
        message: SUCCESSFUL_PASSWORD_UPDATE_MSG,
      })
    )
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
