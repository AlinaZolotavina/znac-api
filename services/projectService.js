const Project = require("../models/project");
const NotFoundError = require("../errors/not-found-err");
const escapeRegex = require("../utils/escapeRegex");
const normalizeHashtags = require("../utils/normalizeHashtags");
const { PROJECT_NOT_FOUND_ERROR_MSG } = require("../utils/constants");

const getProjects = async ({ skip, limit, hashtag }) => {
  const tag = hashtag?.trim();

  const filter = tag
    ? {
        hashtags: {
          $regex: `(^|\\s)${escapeRegex(tag)}(?=\\s|$)`,
          $options: "i",
        },
      }
    : {};

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  return {
    data: projects,
    total,
  };
};

const addProject = ({ owner, title, hashtags, text, link }) =>
  Project.create({
    owner,
    title,
    hashtags: normalizeHashtags(hashtags),
    text,
    link,
  });

const updateProject = async ({
  projectId,
  owner,
  title,
  hashtags,
  text,
  link,
}) => {
  const project = await Project.findOneAndUpdate(
    {
      _id: projectId,
      owner,
    },
    {
      title,
      hashtags: normalizeHashtags(hashtags),
      text,
      link,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!project) {
    throw new NotFoundError(PROJECT_NOT_FOUND_ERROR_MSG);
  }

  return project;
};

const deleteProject = async ({ projectId, owner }) => {
  const project = await Project.findOneAndDelete({
    _id: projectId,
    owner,
  });

  if (!project) {
    throw new NotFoundError(PROJECT_NOT_FOUND_ERROR_MSG);
  }
};

const getProjectHashtags = async (limit) => {
  const hashtags = await Project.aggregate([
    {
      $project: {
        tags: {
          $cond: [
            { $isArray: "$hashtags" },
            "$hashtags",
            { $split: ["$hashtags", " "] },
          ],
        },
      },
    },

    { $unwind: "$tags" },

    { $match: { tags: { $ne: "" } } },

    {
      $group: {
        _id: { $toLower: "$tags" },
        count: { $sum: 1 },
      },
    },

    { $sort: { count: -1, _id: 1 } },

    { $limit: limit },

    {
      $project: {
        _id: 0,
        name: "$_id",
        count: 1,
      },
    },
  ]);

  return hashtags.map((item) => item.name);
};

module.exports = {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getProjectHashtags,
};
