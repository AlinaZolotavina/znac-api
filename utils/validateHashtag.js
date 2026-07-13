const HASHTAG_REGEX = /^[A-Za-zА-Яа-яЁё0-9_]+$/u;

const validateHashtag = (hashtag) => HASHTAG_REGEX.test(String(hashtag));

module.exports = {
  HASHTAG_REGEX,
  validateHashtag,
};
