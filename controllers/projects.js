const Project = require("../models/project");
const NotFoundError = require("../errors/not-found-err");
// const { PHOTO_NOT_FOUND_ERROR_MSG, SUCCESSFUL_PHOTO_DELETE_MSG } = require('../utils/constants');
const escapeRegex = require("../utils/escapeRegex");

const getProjects = (req, res, next) => {
  Project.find({})
    .then((projects) => res.status(200).send(projects))
    .catch(next);
};

const findProject = (req, res, next) => {
  const { keyWord = "" } = req.body;
  const query = keyWord.trim()
    ? {
        hashtags: {
          $regex: escapeRegex(keyWord.trim()),
          $options: "i",
        },
      }
    : {};

  Project.find(query)
    .then((projects) => {
      res.send(projects);
    })
    .catch(next);
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
  Project.create({ owner: req.user._id, title, hashtags, text, link })
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
      hashtags: newHashtags,
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

const getProjectHashtags = (req, res, next) => {
  Project.find({})
    .then((projects) => {
      let hashtags = "";
      projects.forEach((project) => {
        hashtags = hashtags + project.hashtags.toLowerCase() + " ";
      });
      res.send(hashtags.trim().split(" "));
    })
    .catch(next);
};

module.exports = {
  getProjects,
  findProject,
  deleteProject,
  addProject,
  updateProject,
  getProjectHashtags,
};
