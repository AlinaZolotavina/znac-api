/* eslint-disable no-unused-vars */
const { JWT_SECRET, JWT_RESET_PASSWORD, JWT_UPDATE_EMAIL, NODEMAILER_USER } =
  process.env;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../utils/nodemailerTransporter");
const {
  resetPasswordEmailMarkup,
  successfullPasswordUpdateEmailMarkup,
  emailConfirmationEmailMarkup,
  warningOfChangingEmailMarkup,
} = require("../utils/emailHtmlMarkup");
const NotFoundError = require("../errors/not-found-err");
const ConflictError = require("../errors/conflict-err");
const BadRequestError = require("../errors/bad-request-err");
const UnauthorizedError = require("../errors/unauthorized-err");

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
  NEW_PASSWORD_SAME_AS_PRIVIOUS_ERROR_MSG,
  RESET_PASSWORD_SUBJECT,
  RESET_PASSWORD_TEXT,
  WARNING_UPDATE_EMAIL_SUBJECT,
  WARNING_UPDATE_EMAIL_TEXT,
} = require("../utils/constants");

const User = require("../models/user");

const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
    });

    return res.status(201).send({
      user: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.name === "MongoServerError" || err.code === 11000) {
      return next(new ConflictError(CONFLICT_SIGNUP_EMAIL_ERROR_MSG));
    }

    if (err.name === "ValidationError" || err.name === "CastError") {
      return next(new BadRequestError(BAD_REQUEST_ERROR_MSG));
    }

    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findUserByCredentials(email, password);

    const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "7d",
    });

    return res
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
      });
  } catch (err) {
    return next(err);
  }
};

const logout = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return next(new UnauthorizedError(TOKEN_ERROR_MSG));
  }

  try {
    jwt.verify(token, JWT_SECRET);

    return res
      .clearCookie("jwt", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      .send({ message: SUCCESSFUL_LOGOUT_MSG });
  } catch (err) {
    return next(new UnauthorizedError(UNAUTHORIZED_ERROR_MSG));
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
    }
    return res.send(user);
  } catch (err) {
    return next(err);
  }
};

const requestEmailUpdate = async (req, res, next) => {
  try {
    const { newEmail } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
    }

    if (newEmail === user.email) {
      return next(new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG));
    }

    const token = jwt.sign(
      {
        _id: user._id,
        newEmail,
      },
      JWT_UPDATE_EMAIL,
      {
        expiresIn: "20m",
      }
    );

    user.updateEmailLink = token;

    await user.save();

    const dataToOldEmail = {
      from: NODEMAILER_USER,
      to: user.email,
      subject: REQUEST_UPDATE_EMAIL_SUBJECT,
      text: REQUEST_UPDATE_EMAIL_TEXT,
      html: emailConfirmationEmailMarkup(token),
    };

    const dataToNewEmail = {
      from: NODEMAILER_USER,
      to: newEmail,
      subject: WARNING_UPDATE_EMAIL_SUBJECT,
      text: WARNING_UPDATE_EMAIL_TEXT,
      html: warningOfChangingEmailMarkup,
    };

    await transporter.sendMail(dataToOldEmail);

    await transporter.sendMail(dataToNewEmail);

    return res.status(200).send({
      message: "E-mail has been sent, please follow the instructions.",
    });
  } catch (err) {
    return next(err);
  }
};

const updateEmail = async (req, res, next) => {
  try {
    const { updateEmailLink } = req.params;

    if (!updateEmailLink) {
      return next(new UnauthorizedError(AUTHENTICATION_ERROR_MSG));
    }

    let decoded;

    try {
      decoded = jwt.verify(updateEmailLink, JWT_UPDATE_EMAIL);
    } catch {
      return next(new UnauthorizedError(RESET_TOKEN_ERROR_MSG));
    }

    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
    }

    if (user.updateEmailLink !== updateEmailLink) {
      return next(new UnauthorizedError(RESET_TOKEN_ERROR_MSG));
    }

    const existingUser = await User.findOne({
      email: decoded.newEmail,
    });

    if (existingUser) {
      return next(new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG));
    }

    user.email = decoded.newEmail;
    user.updateEmailLink = "";

    await user.save();

    return res.status(200).send({
      message: SUCCESSFUL_EMAIL_UPDATE_MSG,
      user,
    });
  } catch (err) {
    return next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return next(new NotFoundError(USER_NOT_FOUND_ERROR_MSG));
    }

    const matched = await bcrypt.compare(oldPassword, user.password);

    if (!matched) {
      return next(new UnauthorizedError(WRONG_PASSWORD_ERROR_MSG));
    }

    const hash = await bcrypt.hash(newPassword, 10);

    user.password = hash;

    await user.save();

    return res.status(200).send({
      message: SUCCESSFUL_PASSWORD_UPDATE_MSG,
    });
  } catch (err) {
    return next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (user) {
      const token = jwt.sign({ _id: user._id }, JWT_RESET_PASSWORD, {
        expiresIn: "20m",
      });

      user.resetPasswordLink = token;
      await user.save();

      await transporter.sendMail({
        from: NODEMAILER_USER,
        to: user.email,
        subject: FORGOT_PASSWORD_SUBJECT,
        text: FORGOT_PASSWORD_TEXT,
        html: resetPasswordEmailMarkup(token),
      });
    }

    return res.status(200).send({
      message: EMAIL_SENT_SUCCESSFULLY_MSG,
    });
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { resetPasswordLink } = req.params;

    if (!resetPasswordLink) {
      return next(new UnauthorizedError(AUTHENTICATION_ERROR_MSG));
    }

    if (newPassword !== confirmPassword) {
      return next(new BadRequestError("Введенные пароли не совпадают"));
    }

    let decoded;

    try {
      decoded = jwt.verify(resetPasswordLink, JWT_RESET_PASSWORD);
    } catch (err) {
      return next(new UnauthorizedError(RESET_TOKEN_ERROR_MSG));
    }

    const user = await User.findById(decoded._id).select("+password");

    if (!user) {
      return next(new NotFoundError(NO_RESET_TOKEN_ERROR_MSG));
    }

    // токен из ссылки должен совпадать
    // с токеном, сохранённым у пользователя
    if (user.resetPasswordLink !== resetPasswordLink) {
      return next(new UnauthorizedError(RESET_TOKEN_ERROR_MSG));
    }

    const matched = await bcrypt.compare(newPassword, user.password);

    if (matched) {
      return next(new ConflictError(NEW_PASSWORD_SAME_AS_PRIVIOUS_ERROR_MSG));
    }

    const hash = await bcrypt.hash(newPassword, 10);

    user.password = hash;
    user.resetPasswordLink = "";

    await user.save();

    await transporter.sendMail({
      from: NODEMAILER_USER,
      to: user.email,
      subject: RESET_PASSWORD_SUBJECT,
      text: RESET_PASSWORD_TEXT,
      html: successfullPasswordUpdateEmailMarkup,
    });

    return res.status(200).send({
      message: SUCCESSFUL_PASSWORD_UPDATE_MSG,
    });
  } catch (err) {
    return next(err);
  }
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
