const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const app = express();

const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoutes");
const collegeRoutes=require('./routes/collegeRoutes');
const courseRoutes=require("./routes/courseRoutes");
const compareRoutes=require("./routes/compareRoutes");
const meRoutes = require('./routes/meRoutes');
const counsellingRoutes = require('./routes/counsellingRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use(cors());
app.use(express.json());


// Routes (supports both direct and /api prefixes)
app.use("/api/users", userRoutes);
app.use("/api", userRoutes);
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/colleges", collegeRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/courses", courseRoutes);
app.use("/api/courses", courseRoutes);
app.use("/compare", compareRoutes);
app.use("/api/compare", compareRoutes);
app.use("/me", meRoutes);
app.use("/api/me", meRoutes);
app.use("/counselling", counsellingRoutes);
app.use("/api/counselling", counsellingRoutes);
app.use("/admin", adminRoutes);
app.use("/api/admin", adminRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
