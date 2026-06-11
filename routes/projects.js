const router = require("express").Router();
const { validateProjectRequest } = require("../middlewares/validateRequests");
const {
  addProject,
  updateProject,
  deleteProject,
} = require("../controllers/projects");

router.post("/projects", addProject);
router.delete("/projects/:projectId", validateProjectRequest, deleteProject);
router.patch("/projects/:projectId", validateProjectRequest, updateProject);
// router.patch('/photos/:photoId/hashtags', validatePhotoRequest, editHashtags);

module.exports = router;
