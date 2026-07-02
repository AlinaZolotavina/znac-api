const HASHTAG_REGEX = /^[A-Za-zА-Яа-я0-9_]*$/;

const validateHashtag = (hashtag) => HASHTAG_REGEX.test(String(hashtag));

module.exports = {
  HASHTAG_REGEX,
  validateHashtag,
};
