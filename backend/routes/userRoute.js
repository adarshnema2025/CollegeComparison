const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  meProfile,
  updateMyProfile,
  findByEmail,
  getAllUser,
  getSpecificUser,
  deleteUser,
  updateUser,
  createUser,
} = require("../controller/userController");

const router = express.Router();

// Specific routes first
router.get("/me/profile", authMiddleware, meProfile);
router.put("/me/profile", authMiddleware, updateMyProfile);

// General CRUD
router.get("/", getAllUser);
router.get("/:id", getSpecificUser);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);
router.post("/", createUser);

module.exports = router;


