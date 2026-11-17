const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const pool = require("./config/db");
const { COLLEGES } = require("../frontend/collegecomparison/src/data/colleges.js");

async function seed() {
  console.log("Seeding colleges from frontend/data/colleges.js...");

  for (const c of COLLEGES) {
    const category = (c.stream || "engineering").toLowerCase();
    const type =
      (c.ownership || "").toLowerCase().includes("govt") ||
      (c.ownership || "").toLowerCase().includes("government") ||
      (c.ownership || "").toLowerCase().includes("national importance")
        ? "government"
        : (c.ownership || "").toLowerCase().includes("deemed")
        ? "deemed"
        : "private";

    const website = c.website || `https://${(c.code || "college").toLowerCase()}.ac.in`;

    // Upsert into colleges
    const existing = await pool.query("SELECT id FROM colleges WHERE slug = $1", [c.slug]);
    let collegeId;

    if (existing.rows.length > 0) {
      collegeId = existing.rows[0].id;
      await pool.query(
        `UPDATE colleges
         SET name = $1, category = $2, type = $3, city = $4, state = $5,
             established_year = $6, ranking = $7, is_featured = $8, website = $9,
             logo_url = $10, description = $11, extra_info = $12
         WHERE id = $13`,
        [
          c.name,
          category,
          type,
          c.city,
          c.state,
          c.establishedYear || 1960,
          c.nirfRank || 1,
          true,
          website,
          c.heroImage || "",
          c.tagline || c.name,
          JSON.stringify(c),
          collegeId,
        ]
      );
      console.log(`Updated college: ${c.name} (id: ${collegeId})`);
    } else {
      const res = await pool.query(
        `INSERT INTO colleges (name, slug, category, type, city, state, established_year, ranking, is_featured, website, logo_url, description, extra_info)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          c.name,
          c.slug,
          category,
          type,
          c.city,
          c.state,
          c.establishedYear || 1960,
          c.nirfRank || 1,
          true,
          website,
          c.heroImage || "",
          c.tagline || c.name,
          JSON.stringify(c),
        ]
      );
      collegeId = res.rows[0].id;
      console.log(`Inserted college: ${c.name} (id: ${collegeId})`);
    }

    // Now insert programs for this college
    if (Array.isArray(c.programs)) {
      for (const prog of c.programs) {
        const degree = prog.degree || "B.Tech";
        const branch = prog.name || "Engineering";

        // Find or create course
        let courseId;
        const courseRes = await pool.query(
          "SELECT id FROM courses WHERE lower(degree) = lower($1) AND lower(branch) = lower($2)",
          [degree, branch]
        );
        if (courseRes.rows.length > 0) {
          courseId = courseRes.rows[0].id;
        } else {
          const newCourse = await pool.query(
            "INSERT INTO courses (degree, branch, domain) VALUES ($1, $2, $3) RETURNING id",
            [degree, branch, category === "management" ? "Management" : "Engineering"]
          );
          courseId = newCourse.rows[0].id;
        }

        // Calculate fees
        let totalFees = 1000000;
        if (c.stats?.totalDegreeFeeNum) {
          totalFees = Math.round(c.stats.totalDegreeFeeNum * 100000);
        }

        // Calculate placement avg
        let placementAvg = 2000000;
        if (prog.avgCTC) {
          const num = parseFloat(prog.avgCTC.replace(/[^0-9.]/g, ""));
          if (!isNaN(num) && num > 0) {
            placementAvg = Math.round(num * 100000);
          }
        }

        // Upsert college_programs
        const progCheck = await pool.query(
          "SELECT id FROM college_programs WHERE college_id = $1 AND course_id = $2",
          [collegeId, courseId]
        );
        if (progCheck.rows.length === 0) {
          await pool.query(
            `INSERT INTO college_programs
             (college_id, course_id, display_name, mode, duration_years, total_fees, seats, placement_avg, placement_highest, placement_rate, infrastructure, admission_link)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              collegeId,
              courseId,
              `${degree} in ${branch}`,
              c.id === "online-mba-nmims" ? "online" : "offline",
              parseInt(prog.duration) || 4,
              totalFees,
              prog.seats || 100,
              placementAvg,
              placementAvg * 2,
              c.stats?.placementPercent || 90,
              c.campusSize ? `Campus size ${c.campusSize}` : "Top tier facilities",
              website,
            ]
          );
        }
      }
    }
  }

  console.log("Seeding complete!");
  pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  pool.end();
  process.exit(1);
});
