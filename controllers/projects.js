const Project = require("../models/project");
const getPagination = require("../utils/pagination");
const NotFoundError = require("../errors/not-found-err");
const escapeRegex = require("../utils/escapeRegex");
const normalizeHashtags = require("../utils/normalizeHashtags");
// const { PHOTO_NOT_FOUND_ERROR_MSG, SUCCESSFUL_PHOTO_DELETE_MSG } = require('../utils/constants');

const getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const tag = req.query.hashtag?.trim();

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

    res.status(200).send({
      data: projects,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

const deleteProject = (req, res, next) => {
  const { projectId } = req.params;

  Project.findOneAndDelete({
    _id: projectId,
    owner: req.user._id,
  })
    .then((project) => {
      if (!project) {
        throw new NotFoundError("Project not found");
      }

      res.status(200).send({
        message: "Project has been successfully deleted.",
      });
    })
    .catch(next);
};

const addProject = (req, res, next) => {
  const { title, hashtags, text, link } = req.body;
  const hashtagsArray = normalizeHashtags(hashtags);
  Project.create({
    owner: req.user._id,
    title,
    hashtags: hashtagsArray,
    text,
    link,
  })
    .then((project) => res.status(201).send(project))
    .catch(next);
};

const updateProject = (req, res, next) => {
  const { projectId } = req.params;
  const { newTitle, newHashtags, newText, newLink } = req.body;

  Project.findOneAndUpdate(
    {
      _id: projectId,
      owner: req.user._id,
    },
    {
      title: newTitle,
      hashtags: normalizeHashtags(newHashtags),
      text: newText,
      link: newLink,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .then((project) => {
      if (!project) {
        throw new NotFoundError("Project not found");
      }

      res.status(200).send(project);
    })
    .catch(next);
};

// const getProject = (req, res, next) => {
//   console.log(req.params);
//   const { projectId } = req.params;
//   Project.findById(projectId)
//   .then((project => {
//     if (!project) {
//       return next(new NotFoundError("No project"));
//     }
//     return res.status(200).send(project);
//   }))
//   .catch(next);
// }

const getProjectHashtags = async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit);

    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 20, 1),
      100
    );

    const hashtags = await Project.aggregate([
      { $unwind: "$hashtags" },

      // ранее hashtags хранились строкой:
      // "backend js node.js express mongodb"
      { $project: { tags: { $split: ["$hashtags", " "] } } },
      { $unwind: "$tags" },

      { $match: { tags: { $ne: "" } } },

      {
        $group: {
          _id: { $toLower: "$tags" },
          count: { $sum: 1 },
        },
      },

      { $sort: { count: -1, _id: 1 } },

      // Ограничиваем результат уже после подсчёта и сортировки.
      { $limit: limit },

      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
        },
      },
    ]);

    res.status(200).send(hashtags.map((item) => item.name));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  deleteProject,
  addProject,
  updateProject,
  getProjectHashtags,
};
