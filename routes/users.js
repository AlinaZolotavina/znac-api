const router = require("express").Router();
const {
  validateRequestEmailUpdate,
  validateUpdateUserEmail,
  validateUpdatePassword,
} = require("../middlewares/validateRequests");
const {
  getUserProfile,
  requestEmailUpdate,
  updateEmail,
  updatePassword,
} = require("../controllers/users");
const { protectedReadRateLimiter } = require("../middlewares/rateLimiter");

router.get("/profile", protectedReadRateLimiter, getUserProfile);
router.put(
  "/profile/update-email",
  validateRequestEmailUpdate,
  requestEmailUpdate
);
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
