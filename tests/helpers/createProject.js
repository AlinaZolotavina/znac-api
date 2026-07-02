const Project = require("../../models/project");

const createProject = async (ownerId, overrides = {}) =>
  Project.create({
    owner: ownerId,
    title: "Portfolio",
    hashtags: ["node", "express"],
    text: "Project description",
    link: "https://github.com/test/project",
    ...overrides,
  });

module.exports = createProject;
