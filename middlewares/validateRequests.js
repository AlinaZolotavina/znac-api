const { celebrate, Joi } = require("celebrate");
const isUrl = require("validator/lib/isURL");
const {
  BAD_URL_ERROR_MSG,
  INVALID_HASHTAG_ERROR_MSG,
} = require("../utils/constants");
const { validateHashtag } = require("../utils/validateHashtag");

const validateUrl = (url, helpers) => {
  const options =
    process.env.NODE_ENV === "production"
      ? {
          protocols: ["http", "https"],
          require_protocol: true,
          require_tld: true,
        }
      : {
          protocols: ["http", "https"],
          require_protocol: true,
          require_tld: false,
        };
  if (!isUrl(url, options)) {
    throw helpers.message(BAD_URL_ERROR_MSG);
  }
  return url;
};

const validateHashtagName = (value, helpers) => {
  if (!validateHashtag(value)) {
    throw helpers.message(INVALID_HASHTAG_ERROR_MSG);
  }

  return value;
};

const validateSignup = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),
});

const validateSignin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),
});

const validateRequestEmailUpdate = celebrate({
  body: Joi.object().keys({
    newEmail: Joi.string().email().required(),
  }),
});

const validateUpdateUserEmail = celebrate({
  params: Joi.object({
    updateEmailLink: Joi.string().required(),
  }),
});

const validateForgotPassword = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
});

const validateResetPassword = celebrate({
  params: Joi.object().keys({
    resetPasswordLink: Joi.string().required(),
  }),
  body: Joi.object().keys({
    newPassword: Joi.string().min(8).required(),
    confirmPassword: Joi.string().min(8).required(),
  }),
});

const validateUpdatePassword = celebrate({
  body: Joi.object().keys({
    oldPassword: Joi.string().min(8).required(),
    newPassword: Joi.string().min(8).required(),
  }),
});

const validatePhotoRequest = celebrate({
  params: Joi.object().keys({
    photoId: Joi.string().required().alphanum().length(24).hex(),
  }),
});

const validateAddPhoto = celebrate({
  body: Joi.object({
    link: Joi.string().custom(validateUrl),
    filename: Joi.string(),
    hashtags: Joi.string().required().min(2).max(500),
    views: Joi.number().required().integer(),
  }).xor("link", "filename"),
});

const validatePhotoHashtags = celebrate({
  body: Joi.object().keys({
    newHashtags: Joi.string().min(2).max(500).required(),
  }),
});

const validateAddHashtag = celebrate({
  body: Joi.object().keys({
    newHashtag: Joi.string()
      .trim()
      .min(2)
      .max(30)
      .required()
      .custom(validateHashtagName),
  }),
});

const validateUpdateHashtag = celebrate({
  body: Joi.object().keys({
    hashtagName: Joi.string()
      .trim()
      .min(2)
      .max(30)
      .required()
      .custom(validateHashtagName),
  }),
});

const validatePostRequest = celebrate({
  params: Joi.object().keys({
    postId: Joi.string().required().alphanum().length(24).hex(),
  }),
});

const validateAddPost = celebrate({
  body: Joi.object().keys({
    theme: Joi.string().required(),
    icon: Joi.string().required(),
    title: Joi.string().min(2).max(50).required(),
    photoLink: Joi.string().allow("").custom(validateUrl),
    hashtags: Joi.string().min(2).max(500).required(),
    text: Joi.string().min(2).max(5000).required(),
  }),
});

const validateUpdatePost = celebrate({
  body: Joi.object().keys({
    newTheme: Joi.string().required(),
    newIcon: Joi.string().required(),
    newTitle: Joi.string().min(2).max(50).required(),
    newPhotoLink: Joi.string().allow("").custom(validateUrl),
    newHashtags: Joi.string().min(2).max(500).required(),
    newText: Joi.string().min(2).max(5000).required(),
  }),
});

const validateProjectRequest = celebrate({
  params: Joi.object().keys({
    projectId: Joi.string().required().alphanum().length(24).hex(),
  }),
});

const validateAddProject = celebrate({
  body: Joi.object().keys({
    title: Joi.string().min(2).max(50).required(),
    hashtags: Joi.string().min(2).max(500).required(),
    text: Joi.string().min(2).max(5000).required(),
    link: Joi.string().required().custom(validateUrl),
  }),
});

const validateUpdateProject = celebrate({
  body: Joi.object().keys({
    newTitle: Joi.string().min(2).max(50).required(),
    newHashtags: Joi.string().min(2).max(500).required(),
    newText: Joi.string().min(2).max(5000).required(),
    newLink: Joi.string().required().custom(validateUrl),
  }),
});

const validateSearch = celebrate({
  body: Joi.object().keys({
    keyWord: Joi.string().allow("").max(100),
    selectedTheme: Joi.string().max(100),
  }),
});

const validateContactMessage = celebrate({
  body: Joi.object().keys({
    name: Joi.string()
      .trim()
      .min(2)
      .max(80)
      .pattern(/^[A-Za-zА-Яа-яЁё -]+$/)
      .required(),
    email: Joi.string().trim().lowercase().email().max(254).required(),
    message: Joi.string().trim().min(1).max(3000).required(),
  }),
});

module.exports = {
  validateSignup,
  validateSignin,
  validateRequestEmailUpdate,
  validateUpdateUserEmail,
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword,
  validatePhotoRequest,
  validateAddPhoto,
  validatePhotoHashtags,
  validateAddHashtag,
  validateUpdateHashtag,
  validatePostRequest,
  validateAddPost,
  validateUpdatePost,
  validateProjectRequest,
  validateAddProject,
  validateUpdateProject,
  validateSearch,
  validateContactMessage,
};
