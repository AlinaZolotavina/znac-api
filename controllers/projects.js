const getPagination = require("../utils/pagination");
const projectService = require("../services/projectService");

const getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const result = await projectService.getProjects({
      skip,
      limit,
      hashtag: req.query.hashtag,
    });

    res.status(200).send({
      data: result.data,
      page,
      limit,
      total: result.total,
      pages: Math.max(1, Math.ceil(result.total / limit)),
    });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject({
      projectId: req.params.projectId,
      owner: req.user._id,
    });

    res.status(200).send({
      message: "Project has been successfully deleted.",
    });
  } catch (err) {
    next(err);
  }
};

const addProject = async (req, res, next) => {
  try {
    const project = await projectService.addProject({
      owner: req.user._id,
      title: req.body.title,
      hashtags: req.body.hashtags,
      text: req.body.text,
      link: req.body.link,
    });

    res.status(201).send(project);
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject({
      projectId: req.params.projectId,
      owner: req.user._id,
      title: req.body.newTitle,
      hashtags: req.body.newHashtags,
      text: req.body.newText,
      link: req.body.newLink,
    });

    res.status(200).send(project);
  } catch (err) {
    next(err);
  }
};

const getProjectHashtags = async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit);

    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 20, 1),
      100
    );

    const hashtags = await projectService.getProjectHashtags(limit);

    res.status(200).send(hashtags);
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
