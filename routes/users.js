const router = require('express').Router();
const { validateUpdateUserEmail } = require('../middlewares/validateRequests');
const { getMe, updateUserEmail } = require('../controllers/users');

router.get('/users/me', getMe);
router.patch('/user/me', validateUpdateUserEmail, updateUserEmail);

module.exports = router;
