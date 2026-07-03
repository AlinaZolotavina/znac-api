const mongoose = require("mongoose");
const isUrl = require("validator/lib/isURL");
const { IMAGE_BAD_URL_ERROR_MSG } = require("../utils/constants");

const photoSchema = new mongoose.Schema({
  link: {
    type: String,
    validate: {
      validator(v) {
        return !v || isUrl(v, { require_tld: false });
      },
      message: IMAGE_BAD_URL_ERROR_MSG,
    },
  },

  filename: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  hashtags: [
    {
      type: String,
      lowercase: true,
      trim: true,
    },
  ],
  views: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

photoSchema.index({ owner: 1 });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ hashtags: 1 });
photoSchema.pre("validate", function (next) {
  const hasLink = Boolean(this.link);
  const hasFilename = Boolean(this.filename);

  if (!hasLink && !hasFilename) {
    this.invalidate("filename", "Either link or filename is required");
  }

  if (hasLink && hasFilename) {
    this.invalidate(
      "filename",
      "Only one of link or filename can be specified"
    );
  }

  next();
});

module.exports = mongoose.model("photo", photoSchema);
