const adminService = require("../service/adminService");

// 1. List Users
async function getUsers(req, res, next) {
  try {
    const users = await adminService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// 2. Colleges
async function createCollege(req, res, next) {
  try {
    const college = await adminService.createCollege(req.body);
    res.status(201).json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
}

async function updateCollege(req, res, next) {
  try {
    const id = req.params.id;
    const college = await adminService.updateCollege(id, req.body);
    if (!college) {
      return res.status(404).json({ success: false, error: "College not found" });
    }
    res.json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
}

async function deleteCollege(req, res, next) {
  try {
    const id = req.params.id;
    const deleted = await adminService.deleteCollege(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "College not found" });
    }
    res.json({ success: true, message: "College deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function patchCollegeFeatured(req, res, next) {
  try {
    const id = req.params.id;
    const college = await adminService.toggleCollegeFeatured(id, req.body);
    if (!college) {
      return res.status(404).json({ success: false, error: "College not found" });
    }
    res.json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
}

// 3. Programs
async function addProgram(req, res, next) {
  try {
    const collegeId = req.params.id;
    const program = await adminService.addProgramToCollege(collegeId, req.body);
    res.status(201).json({ success: true, data: program });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    next(err);
  }
}

async function updateProgram(req, res, next) {
  try {
    const id = Number(req.params.id);
    const program = await adminService.updateProgram(id, req.body);
    if (!program) {
      return res.status(404).json({ success: false, error: "Program not found" });
    }
    res.json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
}

async function deleteProgram(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await adminService.deleteProgram(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Program not found" });
    }
    res.json({ success: true, message: "Program deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// 4. Courses
async function createCourse(req, res, next) {
  try {
    const course = await adminService.addCourse(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

async function updateCourse(req, res, next) {
  try {
    const id = Number(req.params.id);
    const course = await adminService.updateCourse(id, req.body);
    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

// 5. Counselling
async function getCounselling(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    const requests = await adminService.getAllCounselling({
      status,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

async function patchCounsellingStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const updated = await adminService.updateCounsellingStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Counselling request not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    next(err);
  }
}

// 6. Bulk Import
async function importColleges(req, res, next) {
  try {
    let rows = [];
    if (Array.isArray(req.body)) {
      rows = req.body;
    } else if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else if (typeof req.body.csvData === "string") {
      // Simple CSV parser
      const lines = req.body.csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || "";
        });
        rows.push(obj);
      }
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: "No rows provided for import" });
    }

    const result = await adminService.importCollegesBulk(rows);
    res.json({ success: true, summary: result, data: result, ...result });
  } catch (err) {
    next(err);
  }
}

// 7. CSV Exports
async function exportCounsellingCSV(req, res, next) {
  try {
    const range = req.query.range || "all";
    const { csv, filename } = await adminService.getCounsellingExportData(range);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

async function exportUsersCSV(req, res, next) {
  try {
    const range = req.query.range || "all";
    const { csv, filename } = await adminService.getUsersExportData(range);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
