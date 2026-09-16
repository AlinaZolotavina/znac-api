const getPagination = require("../utils/pagination");
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

module.exports = {
  getHashtags,
};
