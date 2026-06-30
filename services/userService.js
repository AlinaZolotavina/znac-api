const { JWT_SECRET, JWT_RESET_PASSWORD, JWT_UPDATE_EMAIL, NODEMAILER_USER } =
  process.env;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const transporter = require("../utils/nodemailerTransporter");

const User = require("../models/user");

const NotFoundError = require("../errors/not-found-err");
const ConflictError = require("../errors/conflict-err");
const BadRequestError = require("../errors/bad-request-err");
const UnauthorizedError = require("../errors/unauthorized-err");

const {
  CONFLICT_SIGNUP_EMAIL_ERROR_MSG,
  TOKEN_ERROR_MSG,
  USER_NOT_FOUND_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  WRONG_PASSWORD_ERROR_MSG,
  AUTHENTICATION_ERROR_MSG,
  RESET_TOKEN_ERROR_MSG,
  NO_RESET_TOKEN_ERROR_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
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

const {
  resetPasswordEmailMarkup,
  successfullPasswordUpdateEmailMarkup,
  emailConfirmationEmailMarkup,
  warningOfChangingEmailMarkup,
} = require("../utils/emailHtmlMarkup");

// Registration
const createUser = async ({ name, email, password }) => {
  const hash = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      name,
      email,
      password: hash,
    });

    return user;
  } catch (err) {
    if (err.name === "MongoServerError" || err.code === 11000) {
      throw new ConflictError(CONFLICT_SIGNUP_EMAIL_ERROR_MSG);
    }

    throw err;
  }
};

// Authentication
const login = async ({ email, password }) => {
  const user = await User.findUserByCredentials(email, password);

  const token = jwt.sign(
    {
      _id: user._id,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );

  return {
    user,
    token,
  };
};

const logout = (token) => {
  if (!token) {
    throw new UnauthorizedError(TOKEN_ERROR_MSG);
  }

  try {
    jwt.verify(token, JWT_SECRET);

    return true;
  } catch {
    throw new UnauthorizedError(UNAUTHORIZED_ERROR_MSG);
  }
};

// Profile
const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError(USER_NOT_FOUND_ERROR_MSG);
  }

  return user;
};

const updatePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new NotFoundError(USER_NOT_FOUND_ERROR_MSG);
  }

  const matched = await bcrypt.compare(oldPassword, user.password);

  if (!matched) {
    throw new UnauthorizedError(WRONG_PASSWORD_ERROR_MSG);
  }

  const hash = await bcrypt.hash(newPassword, 10);

  user.password = hash;

  await user.save();
};

const requestEmailUpdate = async ({ userId, newEmail }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError(USER_NOT_FOUND_ERROR_MSG);
  }

  if (newEmail === user.email) {
    throw new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG);
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

  await transporter.sendMail({
    from: NODEMAILER_USER,
    to: user.email,
    subject: REQUEST_UPDATE_EMAIL_SUBJECT,
    text: REQUEST_UPDATE_EMAIL_TEXT,
    html: emailConfirmationEmailMarkup(token),
  });

  await transporter.sendMail({
    from: NODEMAILER_USER,
    to: newEmail,
    subject: WARNING_UPDATE_EMAIL_SUBJECT,
    text: WARNING_UPDATE_EMAIL_TEXT,
    html: warningOfChangingEmailMarkup,
  });
};

const updateEmail = async (updateEmailLink) => {
  if (!updateEmailLink) {
    throw new UnauthorizedError(AUTHENTICATION_ERROR_MSG);
  }

  let decoded;

  try {
    decoded = jwt.verify(updateEmailLink, JWT_UPDATE_EMAIL);
  } catch {
    throw new UnauthorizedError(RESET_TOKEN_ERROR_MSG);
  }

  const user = await User.findById(decoded._id);

  if (!user) {
    throw new NotFoundError(USER_NOT_FOUND_ERROR_MSG);
  }

  if (user.updateEmailLink !== updateEmailLink) {
    throw new UnauthorizedError(RESET_TOKEN_ERROR_MSG);
  }

  const existingUser = await User.findOne({
    email: decoded.newEmail,
  });

  if (existingUser) {
    throw new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG);
  }

  user.email = decoded.newEmail;
  user.updateEmailLink = "";

  await user.save();

  return user;
};

// Password reset
const forgotPassword = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (user) {
    const token = jwt.sign(
      {
        _id: user._id,
      },
      JWT_RESET_PASSWORD,
      {
        expiresIn: "20m",
      }
    );

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
};

const resetPassword = async ({
  resetPasswordLink,
  newPassword,
  confirmPassword,
}) => {
  if (!resetPasswordLink) {
    throw new UnauthorizedError(AUTHENTICATION_ERROR_MSG);
  }

  if (newPassword !== confirmPassword) {
    throw new BadRequestError("Введенные пароли не совпадают");
  }

  let decoded;

  try {
    decoded = jwt.verify(resetPasswordLink, JWT_RESET_PASSWORD);
  } catch {
    throw new UnauthorizedError(RESET_TOKEN_ERROR_MSG);
  }

  const user = await User.findById(decoded._id).select("+password");

  if (!user) {
    throw new NotFoundError(NO_RESET_TOKEN_ERROR_MSG);
  }

  if (user.resetPasswordLink !== resetPasswordLink) {
    throw new UnauthorizedError(RESET_TOKEN_ERROR_MSG);
  }

  const matched = await bcrypt.compare(newPassword, user.password);

  if (matched) {
    throw new ConflictError(NEW_PASSWORD_SAME_AS_PRIVIOUS_ERROR_MSG);
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
};

module.exports = {
  createUser,
  login,
  logout,
  getMe,
  updatePassword,
  requestEmailUpdate,
  updateEmail,
  forgotPassword,
  resetPassword,
};
