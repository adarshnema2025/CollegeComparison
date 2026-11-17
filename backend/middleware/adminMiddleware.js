const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  // Check role or designated admin email
  const isAdmin =
    req.user.role === "admin" ||
    req.user.email === "admin@collegecomparison.com";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }

  next();
};

module.exports = adminMiddleware;
