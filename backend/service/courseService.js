const pool = require('../config/db');

const SORTS = {
  fees_asc:  'cp.total_fees ASC NULLS LAST',
  fees_desc: 'cp.total_fees DESC NULLS LAST',
  ranking:   'c.ranking ASC NULLS LAST',
  placement: 'cp.placement_avg DESC NULLS LAST',
};

async function courseExists(id) {
  const { rowCount } = await pool.query('SELECT 1 FROM courses WHERE id = $1', [id]);
  return rowCount > 0;
}

async function getCollegesByCourseId(courseId, { sort, mode, limit, offset }) {
  const orderBy = SORTS[sort] || SORTS.ranking;

  const { rows } = await pool.query(
    `SELECT
       cp.id                    AS "programId",
       cp.display_name          AS "displayName",
       cp.mode,
       cp.total_fees            AS "totalFees",
       cp.duration_years::float AS "durationYears",
       cp.placement_avg         AS "placementAvg",
       json_build_object(
         'id',    c.id,
         'name',  c.name,
         'slug',  c.slug,
         'city',  c.city,
         'state', c.state,
         'type',  c.type
       ) AS college
     FROM college_programs cp
     JOIN colleges c ON c.id = cp.college_id
     WHERE cp.course_id = $1
       AND ($2::text IS NULL OR cp.mode = $2)
     ORDER BY ${orderBy}, c.name
     LIMIT $3 OFFSET $4`,
    [courseId, mode || null, limit, offset]
  );
  return rows;
}
// GET	/courses	Degrees, branches and specializations for filter dropdowns

const COURSES_SQL = `
  SELECT id, degree, branch, specialization
  FROM courses
  ORDER BY degree, branch, specialization NULLS FIRST
`;

// Only courses that at least one college actually offers
const OFFERED_COURSES_SQL = `
  SELECT co.id, co.degree, co.branch, co.specialization
  FROM courses co
  WHERE EXISTS (
    SELECT 1 FROM college_programs cp WHERE cp.course_id = co.id
  )
  ORDER BY co.degree, co.branch, co.specialization NULLS FIRST
`;

// Degree -> Branch -> Courses, keeping the order the SQL returned
function groupCourses(rows) {
  const degrees = new Map();

  for (const r of rows) {
    if (!degrees.has(r.degree)) degrees.set(r.degree, new Map());
    const branches = degrees.get(r.degree);

    if (!branches.has(r.branch)) branches.set(r.branch, []);
    branches.get(r.branch).push({ id: r.id, specialization: r.specialization });
  }

  return [...degrees].map(([degree, branches]) => ({
    degree,
    branches: [...branches].map(([branch, courses]) => ({ branch, courses })),
  }));
}

// Simple in-memory cache: the catalog rarely changes
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map(); // key -> { data, expires }

async function getCourseCatalog({ offeredOnly = false } = {}) {
  const key = offeredOnly ? 'offered' : 'all';
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  const { rows } = await pool.query(offeredOnly ? OFFERED_COURSES_SQL : COURSES_SQL);
  const data = groupCourses(rows);

  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

function clearCourseCache() {
  cache.clear(); // call this after an admin adds or edits a course
}



module.exports = { courseExists, getCollegesByCourseId ,getCourseCatalog,
  clearCourseCache};