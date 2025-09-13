/* eslint-disable no-console */
const Project = require('../models/project');
const NotFoundError = require('../errors/not-found-err');
// const { PHOTO_NOT_FOUND_ERROR_MSG, SUCCESSFUL_PHOTO_DELETE_MSG } = require('../utils/constants');

const getProjects = (req, res, next) => {
  Project.find({})
    .then((projects) => res.status(200).send(projects))
    .catch(next);
};

const findProject = (req, res, next) => {
  const { keyWord } = req.body;
  Project.find({ hashtags: { $regex: keyWord } })
    .then((projects) => {
      res.send(projects);
    })
    .catch(next);
};

const deleteProject = (req, res, next) => {
  const { projectId } = req.params;
  Project.findById(projectId)
    .then((project) => {
      if (!project) {
        return next(new NotFoundError('Post not found'));
      }
      // if (photo.owner._id.toString() !== req.user._id.toString()) {
      //   return next(new ForbiddenError(FORBIDDEN_ERROR_MSG));
      // }
      return project.remove();
    })
    .then(() => {
      res.status(200).send({ message: 'Project has been successfully deleted.' });
    })
    .catch(next);
};

const addProject = (req, res) => {
  const owner = req.user._id;
  Project.create({ owner, ...req.body })
    .then((project) => res.status(201).send(project))
    .catch((err) => console.log(err));
};

const updateProject = (req, res, next) => {
  console.log('update project');
  const { projectId } = req.params;
  const { newTitle, newHashtags, newText, newLink } = req.body;
    Project.findByIdAndUpdate(projectId, { title: newTitle, hashtags: newHashtags, text: newText, link: newLink, }, { new: true, runValidators: true })
    .then((project) => {
      if (!project) {
        return next(new NotFoundError('Project not found'));
      }
      return res.status(200).send(project);
    })
    .catch(next);
}

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
      let hashtags = '';
      projects.forEach(project => {
        hashtags = hashtags + project.hashtags.toLowerCase() + ' ';
      });
      res.send(hashtags.trim().split(' '));
    })
    .catch(next);
};

module.exports = {
  getProjects,
  findProject,
  deleteProject,
  addProject,
  updateProject,
  getProjectHashtags
};
