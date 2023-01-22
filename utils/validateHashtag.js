module.exports.validateHashtag = (hashtag) => {
  // eslint-disable-next-line no-useless-escape
  const regex = /^[A-Za-zА-Яа-я0-9_]*$/;
  if (regex.test(hashtag)) {
    return hashtag;
  }
  throw new Error('Only letters, numbers and underscores are allowed for hashtags');
};
