const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware'); 
const { getCompareOptions ,createComparison,getComparison} = require('../controller/compareController');

router.get('/options', authMiddleware, getCompareOptions);
router.post('/comparisons', authMiddleware, createComparison);
router.get('/comparisons/:id', authMiddleware, getComparison);


module.exports = router;