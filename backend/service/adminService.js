const pool = require("../config/db");

// 1. Users
async function getAllUsers() {
  const { rows } = await pool.query(
    `SELECT id, name, email, mobile, state, city, education_level, target_degree, preferred_city, role, created_at 
     FROM users 
     ORDER BY id DESC`
  );
  return rows;
}

// 2. Colleges CRUD & Actions
async function createCollege(data) {
  const {
    name,
    slug,
    category = "engineering",
    type = "government",
    city = "",
    state = "",
    established_year = 2000,
    ranking = 100,
    is_featured,
    featured,
    website = "",
    logo_url = "",
    description = "",
    extra_info = {},
  } = data;

  const finalSlug = (slug || name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const validTypes = ["government", "private", "deemed"];
  const normType = validTypes.includes(type?.toLowerCase()?.trim())
    ? type.toLowerCase().trim()
    : "government";

  const featVal = Boolean(is_featured != null ? is_featured : (featured != null ? featured : false));

  const { rows } = await pool.query(
    `INSERT INTO colleges (name, slug, category, type, city, state, established_year, ranking, is_featured, website, logo_url, description, extra_info)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      name,
      finalSlug,
      category || "engineering",
      normType,
      city,
      state,
      Number(established_year) || 2000,
      Number(ranking) || 100,
      featVal,
      website,
      logo_url,
      description,
      JSON.stringify(extra_info || {}),
    ]
  );
  return rows[0];
}

async function updateCollege(id, data) {
  const colRes = await pool.query(
    "SELECT id FROM colleges WHERE id::text = $1 OR slug = $1",
    [String(id)]
  );
  if (colRes.rows.length === 0) return null;
  const realId = colRes.rows[0].id;

  const {
    name,
    slug,
    category,
    type,
    city,
    state,
    established_year,
    ranking,
    is_featured,
    featured,
    website,
    logo_url,
    description,
    extra_info,
  } = data;

  const validTypes = ["government", "private", "deemed"];
  const normType = type
    ? validTypes.includes(type?.toLowerCase()?.trim())
      ? type.toLowerCase().trim()
      : "government"
    : null;

  const featVal = is_featured != null ? Boolean(is_featured) : (featured != null ? Boolean(featured) : null);

  const { rows } = await pool.query(
    `UPDATE colleges
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         category = COALESCE($3, category),
         type = COALESCE($4, type),
         city = COALESCE($5, city),
         state = COALESCE($6, state),
         established_year = COALESCE($7, established_year),
         ranking = COALESCE($8, ranking),
         is_featured = COALESCE($9, is_featured),
         website = COALESCE($10, website),
         logo_url = COALESCE($11, logo_url),
         description = COALESCE($12, description),
         extra_info = CASE WHEN $13::jsonb IS NOT NULL THEN $13::jsonb ELSE extra_info END
     WHERE id = $14
     RETURNING *`,
    [
      name,
      slug,
      category,
      normType,
      city,
      state,
      established_year != null ? Number(established_year) : null,
      ranking != null ? Number(ranking) : null,
      featVal,
      website,
      logo_url,
      description,
      extra_info ? JSON.stringify(extra_info) : null,
      realId,
    ]
  );
  return rows[0] || null;
}

async function deleteCollege(id) {
  const colRes = await pool.query(
    "SELECT id FROM colleges WHERE id::text = $1 OR slug = $1",
    [String(id)]
  );
  if (colRes.rows.length === 0) return false;
  const realId = colRes.rows[0].id;

  // Cascading deletes for college_programs
  await pool.query("DELETE FROM college_programs WHERE college_id = $1", [realId]);
  const { rowCount } = await pool.query("DELETE FROM colleges WHERE id = $1", [realId]);
  return rowCount > 0;
}

async function toggleCollegeFeatured(id, data = {}) {
  const colRes = await pool.query(
    "SELECT id FROM colleges WHERE id::text = $1 OR slug = $1",
    [String(id)]
  );
  if (colRes.rows.length === 0) return null;
  const realId = colRes.rows[0].id;

  const is_featured =
    data.is_featured != null
      ? Boolean(data.is_featured)
      : data.featured != null
      ? Boolean(data.featured)
      : null;
  const ranking = data.ranking != null ? Number(data.ranking) : null;

  const { rows } = await pool.query(
    `UPDATE colleges
     SET is_featured = COALESCE($1, is_featured),
         ranking = COALESCE($2, ranking)
     WHERE id = $3
     RETURNING *`,
    [is_featured, ranking, realId]
  );
  return rows[0] || null;
}

// 3. College Programs
async function addProgramToCollege(collegeId, data) {
  const {
    courseId,
    displayName,
    mode = "offline",
    durationYears = 4,
    totalFees,
    tuitionFeePerYear,
    seats = 100,
    placementAvg = 1500000,
    placementHighest = 3000000,
    placementRate = 90,
    infrastructure = "",
    admissionLink = "",
  } = data;

  // 1. Verify college exists
  const collegeCheck = await pool.query(
    "SELECT id, name FROM colleges WHERE id::text = $1 OR slug = $1",
    [String(collegeId)]
  );
  if (collegeCheck.rows.length === 0) {
    const err = new Error("College not found");
    err.status = 404;
    throw err;
  }
  const realCollegeId = collegeCheck.rows[0].id;

  // 2. Verify course exists
  const courseCheck = await pool.query(
    "SELECT id, degree, branch FROM courses WHERE id::text = $1",
    [String(courseId)]
  );
  if (courseCheck.rows.length === 0) {
    const err = new Error("Course not found in catalog");
    err.status = 404;
    throw err;
  }
  const course = courseCheck.rows[0];

  // 3. Check duplicate (same college, course, mode)
  const dupCheck = await pool.query(
    "SELECT id FROM college_programs WHERE college_id = $1 AND course_id = $2 AND lower(mode) = lower($3)",
    [realCollegeId, course.id, mode]
  );
  if (dupCheck.rows.length > 0) {
    const err = new Error("A program with this course and mode already exists for this college");
    err.status = 409;
    throw err;
  }

  const finalFees =
    totalFees != null
      ? Number(totalFees)
      : tuitionFeePerYear != null
      ? Number(tuitionFeePerYear) * (Number(durationYears) || 4)
      : 1000000;

  const finalDisplayName = displayName || `${course.degree} in ${course.branch}`;

  // 4. Insert
  const { rows } = await pool.query(
    `INSERT INTO college_programs
       (college_id, course_id, display_name, mode, duration_years, total_fees, seats, placement_avg, placement_highest, placement_rate, infrastructure, admission_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      realCollegeId,
      course.id,
      finalDisplayName,
      mode.toLowerCase(),
      Number(durationYears) || 4,
      finalFees,
      Number(seats) || 100,
      Number(placementAvg) || 1500000,
      Number(placementHighest) || 3000000,
      Number(placementRate) || 90,
      infrastructure,
      admissionLink,
    ]
  );
  return rows[0];
}

async function updateProgram(id, data) {
  const {
    displayName,
    mode,
    durationYears,
    totalFees,
    tuitionFeePerYear,
    seats,
    placementAvg,
    placementHighest,
    placementRate,
    infrastructure,
    admissionLink,
  } = data;

  const finalFees =
    totalFees != null
      ? Number(totalFees)
      : tuitionFeePerYear != null
      ? Number(tuitionFeePerYear) * (Number(durationYears) || 4)
      : null;

  const { rows } = await pool.query(
    `UPDATE college_programs
     SET display_name = COALESCE($1, display_name),
         mode = COALESCE($2, mode),
         duration_years = COALESCE($3, duration_years),
         total_fees = COALESCE($4, total_fees),
         seats = COALESCE($5, seats),
         placement_avg = COALESCE($6, placement_avg),
         placement_highest = COALESCE($7, placement_highest),
         placement_rate = COALESCE($8, placement_rate),
         infrastructure = COALESCE($9, infrastructure),
         admission_link = COALESCE($10, admission_link)
     WHERE id = $11
     RETURNING *`,
    [
      displayName,
      mode ? mode.toLowerCase() : null,
      durationYears != null ? Number(durationYears) : null,
      finalFees,
      seats != null ? Number(seats) : null,
      placementAvg != null ? Number(placementAvg) : null,
      placementHighest != null ? Number(placementHighest) : null,
      placementRate != null ? Number(placementRate) : null,
      infrastructure,
      admissionLink,
      Number(id),
    ]
  );
  return rows[0] || null;
}

async function deleteProgram(id) {
  const { rowCount } = await pool.query("DELETE FROM college_programs WHERE id = $1", [Number(id)]);
  return rowCount > 0;
}

// 4. Courses Catalog CRUD
async function addCourse(data) {
  const degree = data.degree || "B.Tech";
  const branch = data.branch || data.name || data.specialization || "Engineering";
  const specialization = data.specialization || (data.name && data.name !== branch ? data.name : null);
  const domain = data.domain || "Engineering";
  const aliases = Array.isArray(data.aliases) ? data.aliases : [];

  const { rows } = await pool.query(
    `INSERT INTO courses (degree, branch, specialization, domain, aliases)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [degree, branch, specialization, domain, aliases]
  );
  return rows[0];
}

async function updateCourse(id, data) {
  const { degree, branch, specialization, domain, aliases, name } = data;
  const finalBranch = branch || name;

  const { rows } = await pool.query(
    `UPDATE courses
     SET degree = COALESCE($1, degree),
         branch = COALESCE($2, branch),
         specialization = COALESCE($3, specialization),
         domain = COALESCE($4, domain),
         aliases = COALESCE($5, aliases)
     WHERE id = $6
     RETURNING *`,
    [degree, finalBranch, specialization, domain, aliases, Number(id)]
  );
  return rows[0] || null;
}

// 5. Counselling Requests
async function getAllCounselling({ status, limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT
       cr.id,
       cr.status,
       cr.preferred_slot AS "preferredSlot",
       cr.message,
       cr.mobile,
       cr.created_at AS "createdAt",
       cr.comparison_id AS "comparisonId",
       cr.comparison_snapshot,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'email', u.email,
         'mobile', u.mobile
       ) AS user
     FROM counselling_requests cr
     LEFT JOIN users u ON u.id = cr.user_id
     WHERE ($1::text IS NULL OR cr.status = $1)
     ORDER BY cr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [status || null, limit, offset]
  );
  return rows;
}

async function updateCounsellingStatus(id, status) {
  const ALLOWED = ["pending", "contacted", "closed"];
  if (!ALLOWED.includes(status)) {
    const err = new Error(`status must be one of: ${ALLOWED.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE counselling_requests
     SET status = $1
     WHERE id = $2
     RETURNING id, status, preferred_slot AS "preferredSlot", message, mobile, created_at AS "createdAt"`,
    [status, id]
  );
  return rows[0] || null;
}

// 6. Bulk CSV Import
async function importCollegesBulk(rows) {
  const results = {
    total: rows.length,
    imported: 0,
    failed: 0,
    errors: [],
  };

  const client = await pool.connect();
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const collegeName = row.name || row.collegeName;
        if (!collegeName) {
          throw new Error("College name is required");
        }

        const slug = (row.slug || collegeName)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const validTypes = ["government", "private", "deemed"];
        const normType = validTypes.includes(row.type?.toLowerCase()?.trim())
          ? row.type.toLowerCase().trim()
          : "government";

        await client.query("BEGIN");

        // Upsert college
        const existing = await client.query("SELECT id FROM colleges WHERE slug = $1", [slug]);
        let collegeId;
        if (existing.rows.length > 0) {
          collegeId = existing.rows[0].id;
          await client.query(
            `UPDATE colleges
             SET name = $1, category = COALESCE($2, category), type = COALESCE($3, type),
                 city = COALESCE($4, city), state = COALESCE($5, state), ranking = COALESCE($6, ranking)
             WHERE id = $7`,
            [
              collegeName,
              row.category || "engineering",
              normType,
              row.city || "",
              row.state || "",
              row.ranking ? Number(row.ranking) : null,
              collegeId,
            ]
          );
        } else {
          const insertRes = await client.query(
            `INSERT INTO colleges (name, slug, category, type, city, state, ranking, established_year, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
              collegeName,
              slug,
              row.category || "engineering",
              normType,
              row.city || "",
              row.state || "",
              row.ranking ? Number(row.ranking) : 100,
              row.established_year ? Number(row.established_year) : 2000,
              row.is_featured === "true" || row.is_featured === true,
            ]
          );
          collegeId = insertRes.rows[0].id;
        }

        // Map program if provided (degree + branch OR courseName)
        let degree = row.degree;
        let branch = row.branch;
        if (!degree && (row.courseName || row.programName)) {
          const raw = (row.courseName || row.programName).trim();
          const parts = raw.split(" ");
          degree = parts[0];
          branch = parts.slice(1).join(" ") || "General";
        }

        if (degree && branch) {
          let courseId;
          const courseCheck = await client.query(
            "SELECT id FROM courses WHERE lower(degree) = lower($1) AND lower(branch) = lower($2)",
            [degree.trim(), branch.trim()]
          );
          if (courseCheck.rows.length > 0) {
            courseId = courseCheck.rows[0].id;
          } else {
            const courseRes = await client.query(
              "INSERT INTO courses (degree, branch, domain) VALUES ($1, $2, $3) RETURNING id",
              [degree.trim(), branch.trim(), row.category === "management" ? "Management" : "Engineering"]
            );
            courseId = courseRes.rows[0].id;
          }

          const mode = (row.mode || "offline").toLowerCase();
          const fees = row.total_fees
            ? Number(row.total_fees)
            : row.totalFees
            ? Number(row.totalFees)
            : row.tuitionFeePerYear
            ? Number(row.tuitionFeePerYear) * (Number(row.duration_years || row.durationYears) || 4)
            : 1000000;
          const placementAvg = row.placement_avg || row.placementAvg ? Number(row.placement_avg || row.placementAvg) : 1500000;

          await client.query(
            `INSERT INTO college_programs (college_id, course_id, display_name, mode, total_fees, duration_years, placement_avg)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT DO NOTHING`,
            [collegeId, courseId, `${degree} in ${branch}`, mode, fees, Number(row.duration_years || row.durationYears) || 4, placementAvg]
          );
        }

        await client.query("COMMIT");
        results.imported++;
      } catch (rowErr) {
        await client.query("ROLLBACK").catch(() => {});
        results.failed++;
        results.errors.push({ row: i + 1, name: row.name || row.collegeName || "Unknown", error: rowErr.message });
      }
    }
  } finally {
    client.release();
  }

  return results;
}

// 7. CSV Exports (Counselling registrations & Registered users)
function escapeCSVField(val) {
  if (val === null || val === undefined) return '""';
  if (val instanceof Date) {
    return `"${val.toISOString()}"`;
  }
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCSV(headers, rows) {
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSVField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

function getCutoffDate(range) {
  const r = (range || "all").toLowerCase().trim();
  const now = Date.now();
  if (r === "1d" || r === "1day" || r === "last1day") {
    return { cutoff: new Date(now - 24 * 60 * 60 * 1000), label: "1d" };
  }
  if (r === "3d" || r === "3day" || r === "3days" || r === "last3days") {
    return { cutoff: new Date(now - 3 * 24 * 60 * 60 * 1000), label: "3d" };
  }
  if (r === "7d" || r === "7day" || r === "7days" || r === "last7days") {
    return { cutoff: new Date(now - 7 * 24 * 60 * 60 * 1000), label: "7d" };
  }
  return { cutoff: null, label: "all_time" };
}

async function getCounsellingExportData(range) {
  const { cutoff, label } = getCutoffDate(range);
  const cutoffIso = cutoff ? cutoff.toISOString() : null;

  const query = `
    SELECT
      'Request' AS entry_type,
      cr.id AS record_id,
      cr.created_at,
      cr.status,
      u.id AS student_id,
      u.name AS student_name,
      u.email AS student_email,
      COALESCE(cr.mobile, u.mobile) AS mobile,
      u.city,
      u.state,
      u.target_degree,
      u.education_level,
      cr.preferred_slot::text AS slot_or_preferred_time,
      '-' AS counsellor_name,
      '-' AS counsellor_email,
      cr.comparison_id,
      cr.message
    FROM counselling_requests cr
    LEFT JOIN users u ON u.id = cr.user_id
    WHERE ($1::timestamptz IS NULL OR cr.created_at >= $1)

    UNION ALL

    SELECT
      'Slot Booking' AS entry_type,
      b.id AS record_id,
      b.created_at,
      b.status,
      u.id AS student_id,
      u.name AS student_name,
      u.email AS student_email,
      COALESCE(b.mobile, u.mobile) AS mobile,
      u.city,
      u.state,
      u.target_degree,
      u.education_level,
      s.slot_start::text AS slot_or_preferred_time,
      c.name AS counsellor_name,
      c.email AS counsellor_email,
      b.comparison_id,
      b.message
    FROM counselling_bookings b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN counselling_slots s ON s.id = b.slot_id
    LEFT JOIN counsellors c ON c.id = b.counsellor_id
    WHERE ($1::timestamptz IS NULL OR b.created_at >= $1)

    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query, [cutoffIso]);

  const headers = [
    "Entry Type",
    "Record ID",
    "Created At",
    "Status",
    "Student ID",
    "Student Name",
    "Student Email",
    "Mobile",
    "City",
    "State",
    "Target Degree",
    "Education Level",
    "Slot / Preferred Time",
    "Assigned Counsellor",
    "Counsellor Email",
    "Comparison ID",
    "Message / Notes",
  ];

  const dataRows = rows.map((r) => [
    r.entry_type,
    r.record_id,
    r.created_at ? new Date(r.created_at).toISOString() : "",
    r.status,
    r.student_id ?? "",
    r.student_name ?? "",
    r.student_email ?? "",
    r.mobile ?? "",
    r.city ?? "",
    r.state ?? "",
    r.target_degree ?? "",
    r.education_level ?? "",
    r.slot_or_preferred_time ?? "",
    r.counsellor_name ?? "-",
    r.counsellor_email ?? "-",
    r.comparison_id ?? "-",
    r.message ?? "",
  ]);

  const csv = buildCSV(headers, dataRows);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `counselling_registered_students_${label}_${dateStr}.csv`;

  return { csv, count: rows.length, filename };
}

async function getUsersExportData(range) {
  const { cutoff, label } = getCutoffDate(range);
  const cutoffIso = cutoff ? cutoff.toISOString() : null;

  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.mobile,
      u.city,
      u.state,
      u.education_level,
      u.target_degree,
      u.preferred_city,
      u.role,
      u.created_at
    FROM users u
    WHERE ($1::timestamptz IS NULL OR u.created_at >= $1)
    ORDER BY u.created_at DESC
  `;

  const { rows } = await pool.query(query, [cutoffIso]);

  const headers = [
    "User ID",
    "Name",
    "Email",
    "Mobile",
    "City",
    "State",
    "Education Level",
    "Target Degree",
    "Preferred City",
    "Role",
    "Registered At",
  ];

  const dataRows = rows.map((u) => [
    u.id,
    u.name ?? "",
    u.email ?? "",
    u.mobile ?? "",
    u.city ?? "",
    u.state ?? "",
    u.education_level ?? "",
    u.target_degree ?? "",
    u.preferred_city ?? "",
    u.role ?? "user",
    u.created_at ? new Date(u.created_at).toISOString() : "",
  ]);

  const csv = buildCSV(headers, dataRows);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `registered_students_${label}_${dateStr}.csv`;

  return { csv, count: rows.length, filename };
}

module.exports = {
  getAllUsers,
  createCollege,
  updateCollege,
  deleteCollege,
  toggleCollegeFeatured,
  addProgramToCollege,
  updateProgram,
  deleteProgram,
  addCourse,
  updateCourse,
  getAllCounselling,
  updateCounsellingStatus,
  importCollegesBulk,
  getCounsellingExportData,
  getUsersExportData,
};
