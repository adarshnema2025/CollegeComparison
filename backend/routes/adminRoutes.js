const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getUsers,
  createCollege,
  updateCollege,
  deleteCollege,
  patchCollegeFeatured,
  addProgram,
  updateProgram,
  deleteProgram,
  createCourse,
  updateCourse,
  getCounselling,
  patchCounsellingStatus,
  importColleges,
  exportCounsellingCSV,
  exportUsersCSV,
} = require("../controller/adminController");
const {createCounsellor,listCounsellors,updateCounsellor}=require("../controller/counsellingController")

// Protect all /admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Users
router.get("/users", getUsers);

// CSV Data Exports
router.get("/export/counselling", exportCounsellingCSV);
router.get("/export/users", exportUsersCSV);

// Bulk Import & Nested College Programs
router.post("/colleges/import", importColleges);
router.post("/colleges/:id/programs", addProgram);
router.patch("/colleges/:id/featured", patchCollegeFeatured);

// Colleges CRUD
router.post("/colleges", createCollege);
router.put("/colleges/:id", updateCollege);
router.delete("/colleges/:id", deleteCollege);

// Programs CRUD
router.put("/programs/:id", updateProgram);
router.delete("/programs/:id", deleteProgram);

// Courses CRUD
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);

// Counselling Requests
router.get("/counselling", getCounselling);
router.patch("/counselling/:id", patchCounsellingStatus);


//To add counsellors
router.post('/counsellors', createCounsellor);
//To get counselors
router.get('/counsellors', listCounsellors);
// GET /api/admin/counsellors
// GET /api/admin/counsellors?isActive=true&sort=load
// GET /api/admin/counsellors?specialization=engineering&q=priya
// GET /api/admin/counsellors?limit=10&offset=10
// Authorization: Bearer <admin token>

router.patch('/counsellors/:id', updateCounsellor);
module.exports = router;
