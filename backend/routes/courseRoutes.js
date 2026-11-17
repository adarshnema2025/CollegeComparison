const router = require('express').Router();
const { getCollegesByCourse, getCourses } = require('../controller/courseController');

router.get('/', getCourses);
router.get('/:id/colleges', getCollegesByCourse);

module.exports = router;
