const Hashtag = require("../../models/hashtag");

const createHashtag = async (overrides = {}) =>
  Hashtag.create({
    name: "node",
    ...overrides,
  });

module.exports = createHashtag;
