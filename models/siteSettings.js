const mongoose = require("mongoose");

const heroImageSchema = new mongoose.Schema(
  {
    filename: String,
    url: String,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    _id: false,
  }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "site-settings",
    },

    heroes: {
      main: {
        type: heroImageSchema,
        default: null,
      },

      gallery: {
        type: heroImageSchema,
        default: null,
      },
    },

    auth: {
      signupEnabled: {
        type: Boolean,
        default: false,
      },

      updatedAt: Date,

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    },

    colors: {
      accent: {
        value: {
          type: String,
          default: "#c5e7bc",
        },

        updatedAt: Date,

        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("siteSettings", siteSettingsSchema);
