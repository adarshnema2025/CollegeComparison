// controllers/college.controller.js
const collegeService = require("../service/collegeService");

const ALLOWED_SORT = ["ranking", "fees_asc", "fees_desc", "name"];
const ALLOWED_MODE = ["online", "offline"];

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

// trimmed string, or undefined (also ignores UI defaults like "All", "All Branches", "All Cities")
const str = (v, max = 100) => {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const trimmed = v.trim();
  if (/^all(\s.*)?$/i.test(trimmed)) return undefined;
  return trimmed.slice(0, max);
};

const int = (v, name, min = 0) => {
  if (v === undefined || v === "" || v === null) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min) {
    throw badRequest(`${name} must be a whole number >= ${min}`);
  }
  return n;
};

const parseFilters = (query) => {
  let mode = str(query.mode)?.toLowerCase();
  if (mode === "all") mode = undefined;
  if (mode && !ALLOWED_MODE.includes(mode)) {
    throw badRequest("mode must be 'online' or 'offline'");
  }

  // Map sort aliases from frontend
  let rawSort = (query.sort || "ranking").toLowerCase().trim();
  let sort = "ranking";
  if (rawSort === "nirf" || rawSort === "ranking") {
    sort = "ranking";
  } else if (rawSort === "feelow" || rawSort === "fees_asc") {
    sort = "fees_asc";
  } else if (rawSort === "feehigh" || rawSort === "fees_desc") {
    sort = "fees_desc";
  } else if (rawSort === "name") {
    sort = "name";
  } else if (rawSort === "salaryhigh" || rawSort === "rating") {
    sort = "ranking";
  } else if (ALLOWED_SORT.includes(rawSort)) {
    sort = rawSort;
  }

  let minFees = int(query.minFees, "minFees");
  let maxFees = int(query.maxFees, "maxFees");

  // Handle fees sent in Lakhs from frontend sliders (e.g., 0 to 30)
  if (minFees != null && minFees > 0 && minFees <= 100) {
    minFees = minFees * 100000;
  }
  if (maxFees != null && maxFees > 0 && maxFees <= 100) {
    maxFees = maxFees * 100000;
  }

  if (minFees != null && maxFees != null && minFees > maxFees) {
    throw badRequest("minFees cannot be greater than maxFees");
  }

  const page = int(query.page, "page", 1) ?? 1;
  const limit = Math.min(int(query.limit, "limit", 1) ?? 12, 100);

  return {
    category: str(query.category),
    state: str(query.state),
    city: str(query.city),
    degree: str(query.degree),
    branch: str(query.branch),
    specialization: str(query.specialization),
    mode,
    minFees,
    maxFees,
    q: str(query.q),
    sort,
    page,
    limit,
  };
};

const listColleges = async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const { data, total } = await collegeService.listColleges(filters);

    res.status(200).json({
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    console.error("listColleges error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

async function getCollegeBySlug(req, res, next) {
  try {
    const slug = req.params.slug.trim();

    const college = await collegeService.getCollegeBySlug(slug);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json(college);
  } catch (err) {
    next(err);
  }
}

async function getCollegePrograms(req, res, next) {
  try {
    const idOrSlug = req.params.id;
    let collegeId = Number(idOrSlug);

    if (!Number.isInteger(collegeId) || collegeId <= 0) {
      // Resolve slug to college
      const college = await collegeService.getCollegeBySlug(idOrSlug);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      collegeId = college.backendId || college.id;
    } else {
      if (!(await collegeService.collegeExists(collegeId))) {
        return res.status(404).json({ message: "College not found" });
      }
    }

    const programs = await collegeService.getProgramsByCollegeId(collegeId);
    res.json(programs);
  } catch (err) {
    next(err);
  }
}

module.exports = { listColleges, getCollegeBySlug, getCollegePrograms };
