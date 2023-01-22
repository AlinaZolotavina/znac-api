const NotFoundError = require('../errors/not-found-err');
const Hashtag = require('../models/hashtag');

const getHashtags = (req, res, next) => {
  Hashtag.find({})
    .then((hashtags) => res.status(200).send(hashtags))
    .catch(next);
};

const addHashtag = (req, res, next) => {
  const { newHashtag } = req.body;
  Hashtag.create({ name: newHashtag })
    .then((h) => res.status(201).send(h))
    .catch(next);
};

const deleteHashtag = (req, res, next) => {
  const { hashtagName } = req.body;
  Hashtag.findOne({ name: hashtagName })
    .then((hashtag) => {
      if (!hashtag) {
        return next(new NotFoundError('Hashtag not found'));
      }
      return hashtag.remove()
        .then(() => res.send({ message: 'Hashtag was deleted' }));
    })
    .catch(next);
};

module.exports = {
  getHashtags,
  addHashtag,
  deleteHashtag,
};
