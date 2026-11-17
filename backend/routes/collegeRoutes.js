const express = require("express");
const router = express.Router();
const {
  listColleges,
  getCollegeBySlug,
  getCollegePrograms,
} = require("../controller/collegeController");

router.get("/", listColleges);
router.get("/:id/programs", getCollegePrograms); // multi-segment route registered before :slug
router.get("/:slug", getCollegeBySlug);

module.exports = router;
