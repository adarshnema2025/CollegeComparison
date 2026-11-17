const pool = require('../config/db');

const OPTIONS_SQL = `
  WITH chosen AS (
    SELECT cp.id, cp.college_id, cp.course_id, cp.mode,
           co.degree, co.branch, co.domain
    FROM college_programs cp
    JOIN courses co ON co.id = cp.course_id
    WHERE cp.id = $1
  ),
  candidates AS (
    SELECT
      cp.id                    AS "programId",
      cp.display_name          AS "displayName",
      cp.mode,
      cp.total_fees            AS "totalFees",
      cp.duration_years::float AS "durationYears",
      CASE
        WHEN cp.course_id = ch.course_id THEN 'exact'
        WHEN co.domain IS NOT NULL AND co.domain = ch.domain THEN 'similar'
        ELSE 'branch_only'
      END AS "matchLevel",
      CASE
        WHEN cp.course_id = ch.course_id THEN 1
        WHEN co.domain IS NOT NULL AND co.domain = ch.domain THEN 2
        ELSE 3
      END AS match_rank,
      c.ranking,
      c.name AS college_name,
      json_build_object(
        'id',    c.id,
        'name',  c.name,
        'slug',  c.slug,
        'city',  c.city,
        'state', c.state
      ) AS college
    FROM chosen ch
    JOIN college_programs cp
      ON cp.id <> ch.id                 -- exclude itself
     AND cp.college_id <> ch.college_id -- exclude same college
     AND cp.mode = ch.mode              -- online vs online
    JOIN courses co
      ON co.id = cp.course_id
     AND co.degree = ch.degree          -- same degree
     AND co.branch = ch.branch          -- same branch
    JOIN colleges c ON c.id = cp.college_id
  )
  SELECT "programId", "displayName", mode, "totalFees", "durationYears",
         "matchLevel", college
  FROM candidates
  ORDER BY match_rank, ranking NULLS LAST, college_name
  LIMIT $2
`;

async function programExists(id) {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM college_programs WHERE id = $1', [id]
  );
  return rowCount > 0;
}

async function getCompareOptions(programId, limit) {
  const { rows } = await pool.query(OPTIONS_SQL, [programId, limit]);
  return rows;
}



const PROGRAMS_SQL = `
  SELECT
    cp.id                    AS "programId",
    cp.display_name          AS "displayName",
    cp.mode,
    cp.total_fees            AS "totalFees",
    cp.duration_years::float AS "durationYears",
    cp.placement_avg         AS "placementAvg",
    cp.placement_highest     AS "placementHighest",
    cp.placement_rate::float AS "placementRate",
    cp.course_id             AS "courseId",
    cp.college_id            AS "collegeId",
    co.degree, co.branch, co.specialization, co.domain,
    json_build_object(
      'id',   c.id,
      'name', c.name,
      'slug', c.slug,
      'city', c.city,
      'state', c.state,
      'type', c.type
    ) AS college
  FROM college_programs cp
  JOIN courses  co ON co.id = cp.course_id
  JOIN colleges c  ON c.id  = cp.college_id
  WHERE cp.id = ANY($1::int[])
`;

// Returns { [programId]: program }
async function getPrograms(ids) {
  const { rows } = await pool.query(PROGRAMS_SQL, [ids]);
  return Object.fromEntries(rows.map((r) => [r.programId, r]));
}

// Same rules as GET /compare/options. Caller has already checked degree + branch.
function computeMatchLevel(a, b) {
  if (a.courseId === b.courseId) return 'exact';
  if (a.domain && a.domain === b.domain) return 'similar';
  return 'branch_only';
}

async function saveComparison(userId, aId, bId, matchLevel) {
  // 1. Try to insert. The unique index makes a duplicate pair a no-op.
  const inserted = await pool.query(
    `INSERT INTO comparisons (user_id, program_a_id, program_b_id, match_level)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, LEAST(program_a_id, program_b_id), GREATEST(program_a_id, program_b_id))
     DO NOTHING
     RETURNING id, match_level AS "matchLevel", created_at AS "createdAt"`,
    [userId, aId, bId, matchLevel]
  );
  if (inserted.rows[0]) return { comparison: inserted.rows[0], created: true };

  // 2. Pair already saved (in either order): return the existing row.
  const existing = await pool.query(
    `SELECT id, match_level AS "matchLevel", created_at AS "createdAt"
     FROM comparisons
     WHERE user_id = $1
       AND LEAST(program_a_id, program_b_id)    = LEAST($2::int, $3::int)
       AND GREATEST(program_a_id, program_b_id) = GREATEST($2::int, $3::int)`,
    [userId, aId, bId]
  );
  return { comparison: existing.rows[0], created: false };
}

// GET 🔒	/comparisons/:id	Reopen a past comparison (six-table JOIN, with ownership check)

// Ownership is enforced in the WHERE clause: wrong owner = no row
async function getComparisonForUser(id, userId) {
  const { rows } = await pool.query(
    `SELECT id,
            program_a_id AS "programAId",
            program_b_id AS "programBId",
            match_level  AS "matchLevel",
            created_at   AS "createdAt"
     FROM comparisons
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  const cmp = rows[0];
  if (!cmp) return null; // doesn't exist OR belongs to someone else

  const programs = await getPrograms([cmp.programAId, cmp.programBId]);

  return {
    id: cmp.id,
    matchLevel: cmp.matchLevel,
    createdAt: cmp.createdAt,
    programA: programs[cmp.programAId],
    programB: programs[cmp.programBId],
  };
}

module.exports = { 
  programExists, getCompareOptions,getPrograms, computeMatchLevel, saveComparison,getComparisonForUser };