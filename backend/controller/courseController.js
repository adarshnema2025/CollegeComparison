const courseService = require('../service/courseService');

async function getCollegesByCourse(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid course id' });
    }

    const { sort, mode } = req.query;
    if (mode && !['online', 'offline'].includes(mode)) {
      return res.status(400).json({ message: "mode must be 'online' or 'offline'" });
    }

    // pagination: default 20, hard cap 100
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    if (!(await courseService.courseExists(id))) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const colleges = await courseService.getCollegesByCourseId(id, {
      sort, mode, limit, offset,
    });
    res.json(colleges);
  } catch (err) {
    next(err);
  }
}

async function getCourses(req, res, next) {
  try {
    const offeredOnly = req.query.offered === 'true';
    const catalog = await courseService.getCourseCatalog({ offeredOnly });

    res.set('Cache-Control', 'public, max-age=3600');
    res.json(catalog);
  } catch (err) {
    next(err);
  }
}



module.exports = { getCollegesByCourse ,getCourses};