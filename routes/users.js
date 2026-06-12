const router = require("express").Router();
const {
  validateUpdateUserEmail,
  validateUpdatePassword,
} = require("../middlewares/validateRequests");
const {
  getMe,
  requestEmailUpdate,
  updateEmail,
  updatePassword,
} = require("../controllers/users");

router.get("/profile", getMe);
router.put("/profile/update-email", requestEmailUpdate);
router.patch(
  "/profile/update-email/:updateEmailLink",
  validateUpdateUserEmail,
  updateEmail
);
router.patch(
  "/profile/update-password",
  validateUpdatePassword,
  updatePassword
);

module.exports = router;
