const router = require("express").Router();
const {
  validateProjectRequest,
  validateAddProject,
  validateUpdateProject,
} = require("../middlewares/validateRequests");
const {
  addProject,
  updateProject,
  deleteProject,
} = require("../controllers/projects");

router.post("/projects", validateAddProject, addProject);
router.delete("/projects/:projectId", validateProjectRequest, deleteProject);
router.patch(
  "/projects/:projectId",
  validateProjectRequest,
  validateUpdateProject,
  updateProject
);
// router.patch('/photos/:photoId/hashtags', validatePhotoRequest, editHashtags);

module.exports = router;
