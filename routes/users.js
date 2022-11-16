const router = require('express').Router();
const { validateUpdateUserEmail } = require('../middlewares/validateRequests');
const { getMe, updateUserEmail, updatePassword } = require('../controllers/users');

router.get('/profile', getMe);
router.patch('/profile/update-email', validateUpdateUserEmail, updateUserEmail);
router.patch('/profile/update-password', updatePassword);

module.exports = router;
