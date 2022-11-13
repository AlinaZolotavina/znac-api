const { celebrate, Joi } = require('celebrate');
const isUrl = require('validator/lib/isURL');
const BadRequestError = require('../errors/bad-request-err');
const { BAD_URL_ERROR_MSG } = require('../utils/constants');

const validateUrl = (url) => {
  if (!isUrl(url)) {
    throw new BadRequestError(BAD_URL_ERROR_MSG);
  }
  return url;
};

const validateSignupOrSignin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

const validateUpdateUserEmail = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
});

const validateAddPhoto = celebrate({
  body: Joi.object().keys({
    link: Joi.string().required().custom(validateUrl),
    hashtags: Joi.string().required().min(2).max(500),
    views: Joi.number().required().integer(),
  }),
});

const validateDeletePhoto = celebrate({
  params: Joi.object().keys({
    photoId: Joi.string().required().alphanum().length(24)
      .hex(),
  }),
});

module.exports = {
  validateSignupOrSignin,
  validateUpdateUserEmail,
  validateAddPhoto,
  validateDeletePhoto,
};
