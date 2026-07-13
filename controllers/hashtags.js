const getPagination = require("../utils/pagination");
const normalizeHashtagName = require("../utils/normalizeHashtagName");
const NotFoundError = require("../errors/not-found-err");
const ConflictError = require("../errors/conflict-err");
const {
  CONFLICT_HASHTAG_ERROR_MSG,
  HASHTAG_NOT_FOUND_ERROR_MSG,
} = require("../utils/constants");
const Hashtag = require("../models/hashtag");

const getHashtags = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [hashtags, total] = await Promise.all([
      Hashtag.find({}).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Hashtag.countDocuments(),
    ]);
    res.status(200).send({
      data: hashtags,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

const addHashtag = (req, res, next) => {
  const name = normalizeHashtagName(req.body.newHashtag);

  Hashtag.create({ name })
    .then((hashtag) => res.status(201).send(hashtag))
    .catch((err) => {
      if (err.code === 11000) {
        return next(new ConflictError(CONFLICT_HASHTAG_ERROR_MSG));
      }

      return next(err);
    });
};

const updateHashtag = (req, res, next) => {
  const name = normalizeHashtagName(req.body.hashtagName);

  Hashtag.findOneAndUpdate(
    { name },
    { createdAt: Date.now() },
    { returnDocument: "after" }
  )
    .then((hashtag) => {
      if (!hashtag) {
        return next(new NotFoundError(HASHTAG_NOT_FOUND_ERROR_MSG));
      }

      return res.status(200).send(hashtag);
    })
    .catch(next);
};

module.exports = {
  getHashtags,
  addHashtag,
  updateHashtag,
};
