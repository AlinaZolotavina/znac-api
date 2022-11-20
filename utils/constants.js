const INTERNAL_SERVER_ERROR = 'Internal Server Error';
const NOT_FOUND_ERROR_MSG = 'The server can not find the requested resource';
const USER_NOT_FOUND_ERROR_MSG = 'User is not found';
const PHOTO_NOT_FOUND_ERROR_MSG = 'Photo is not found';
const BAD_REQUEST_ERROR_MSG = 'The entered data is incorrect';
const BAD_URL_ERROR_MSG = 'Invalid Link';
const IMAGE_BAD_URL_ERROR_MSG = 'Invalid image link';
const BAD_EMAIL_ERROR_MSG = 'Invalid e-mail';
const UNAUTHORIZED_ERROR_MSG = 'Authorization required';
const WRONG_EMAIL_OR_PASSWORD_ERROR_MSG = 'Wrong e-mail or password';
const WRONG_PASSWORD_ERROR_MSG = 'The password is wrong';
const TOKEN_ERROR_MSG = 'Token error';
const CONFLICT_SIGNUP_EMAIL_ERROR_MSG = 'User with this e-mail already exists';
const FORBIDDEN_ERROR_MSG = 'You are not allowed to delete this photo';
const CONFLICT_UPDATE_EMAIL_ERROR_MSG = 'The email you entered is already in use';
const AUTHENTICATION_ERROR_MSG = 'Authentication error';
const RESET_TOKEN_ERROR_MSG = 'Incorrect token or it is expired';
const NO_RESET_TOKEN_ERROR_MSG = 'User with this token does not exist';

const SUCCESSFUL_LOGIN_MSG = 'You have successfully logged in';
const SUCCESSFUL_LOGOUT_MSG = 'You successfully logged out';
const SUCCESSFUL_EMAIL_UPDATE_MSG = 'Your e-mail has been updated';
const SUCCESSFUL_PASSWORD_UPDATE_MSG = 'Your password has been updated';
const SUCCESSFUL_PHOTO_DELETE_MSG = 'The photo has been deleted';
const EMAIL_SENT_SUCCESSFULLY_MSG = 'E-mail has been sent, please follow the instructions.';

const REQUEST_UPDATE_EMAIL_SUBJECT = 'Confirm your e-mail';
const REQUEST_UPDATE_EMAIL_TEXT = 'We got a request to change your e-mail.';
const FORGOT_PASSWORD_SUBJECT = 'Reset your password';
const FORGOT_PASSWORD_TEXT = 'We got a request to reset your password.';
const RESET_PASSWORD_SUBJECT = 'Your password has been changed';
const RESET_PASSWORD_TEXT = 'Your password has been changed';

module.exports = {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND_ERROR_MSG,
  USER_NOT_FOUND_ERROR_MSG,
  PHOTO_NOT_FOUND_ERROR_MSG,
  BAD_REQUEST_ERROR_MSG,
  BAD_URL_ERROR_MSG,
  IMAGE_BAD_URL_ERROR_MSG,
  BAD_EMAIL_ERROR_MSG,
  UNAUTHORIZED_ERROR_MSG,
  WRONG_EMAIL_OR_PASSWORD_ERROR_MSG,
  WRONG_PASSWORD_ERROR_MSG,
  TOKEN_ERROR_MSG,
  CONFLICT_SIGNUP_EMAIL_ERROR_MSG,
  FORBIDDEN_ERROR_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
  AUTHENTICATION_ERROR_MSG,
  RESET_TOKEN_ERROR_MSG,
  NO_RESET_TOKEN_ERROR_MSG,
  SUCCESSFUL_LOGIN_MSG,
  SUCCESSFUL_LOGOUT_MSG,
  SUCCESSFUL_EMAIL_UPDATE_MSG,
  SUCCESSFUL_PASSWORD_UPDATE_MSG,
  SUCCESSFUL_PHOTO_DELETE_MSG,
  EMAIL_SENT_SUCCESSFULLY_MSG,
  REQUEST_UPDATE_EMAIL_SUBJECT,
  REQUEST_UPDATE_EMAIL_TEXT,
  FORGOT_PASSWORD_SUBJECT,
  FORGOT_PASSWORD_TEXT,
  RESET_PASSWORD_SUBJECT,
  RESET_PASSWORD_TEXT,
};
