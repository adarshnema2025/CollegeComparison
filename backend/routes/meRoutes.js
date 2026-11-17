const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getMyComparisons, deleteComparison, getMyCounselling } = require('../controller/meController');
const { meProfile, updateMyProfile } = require('../controller/userController');

router.use(authMiddleware); // everything under /me is login-gated

router.get('/profile', meProfile);
router.put('/profile', updateMyProfile);
router.get('/comparisons', getMyComparisons);
router.delete('/:id', deleteComparison);
router.get('/counselling', getMyCounselling);

module.exports = router;
