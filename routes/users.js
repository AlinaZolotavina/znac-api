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
  validateEmailChangeLink,
} = require("../controllers/users");
const {
  protectedReadRateLimiter,
  emailChangeRateLimiter,
} = require("../middlewares/rateLimiter");

router.get("/profile", protectedReadRateLimiter, getUserProfile);
router.put(
  "/profile/update-email",
  emailChangeRateLimiter,
  validateRequestEmailUpdate,
  requestEmailUpdate
);
router.patch(
  "/profile/update-email/:token",
  validateUpdateUserEmail,
  updateEmail
);
router.get(
  "/profile/update-email/:token",
  protectedReadRateLimiter,
  validateUpdateUserEmail,
  validateEmailChangeLink
);
router.patch(
  "/profile/update-password",
  validateUpdatePassword,
  updatePassword
);

module.exports = router;
