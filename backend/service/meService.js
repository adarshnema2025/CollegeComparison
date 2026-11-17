const pool = require('../config/db.js');

// Slim card shape: enough for a list row, full data lives on GET /comparisons/:id
const HISTORY_SQL = `
  SELECT
    cmp.id,
    cmp.match_level AS "matchLevel",
    cmp.created_at  AS "createdAt",
    json_build_object(
      'programId', pa.id, 'displayName', pa.display_name, 'mode', pa.mode,
      'totalFees', pa.total_fees,
      'degree', coa.degree, 'branch', coa.branch, 'specialization', coa.specialization,
      'college', json_build_object('id', ca.id, 'name', ca.name, 'slug', ca.slug,
                                   'city', ca.city)
    ) AS "programA",
    json_build_object(
      'programId', pb.id, 'displayName', pb.display_name, 'mode', pb.mode,
      'totalFees', pb.total_fees,
      'degree', cob.degree, 'branch', cob.branch, 'specialization', cob.specialization,
      'college', json_build_object('id', cb.id, 'name', cb.name, 'slug', cb.slug,
                                   'city', cb.city)
    ) AS "programB"
  FROM comparisons cmp
  JOIN college_programs pa ON pa.id = cmp.program_a_id
  JOIN courses  coa        ON coa.id = pa.course_id
  JOIN colleges ca         ON ca.id  = pa.college_id
  JOIN college_programs pb ON pb.id = cmp.program_b_id
  JOIN courses  cob        ON cob.id = pb.course_id
  JOIN colleges cb         ON cb.id  = pb.college_id
  WHERE cmp.user_id = $1
  ORDER BY cmp.created_at DESC, cmp.id DESC
  LIMIT $2 OFFSET $3
`;

async function getComparisonHistory(userId, { limit, offset }) {
  // Run both queries in parallel; they're independent
  const [list, count] = await Promise.all([
    pool.query(HISTORY_SQL, [userId, limit, offset]),
    pool.query('SELECT COUNT(*)::int AS total FROM comparisons WHERE user_id = $1', [userId]),
  ]);

  return {
    items: list.rows,
    total: count.rows[0].total,
    limit,
    offset,
  };
}

async function deleteComparisonForUser(id, userId) {
  const { rowCount } = await pool.query(
    'DELETE FROM comparisons WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0; // false => doesn't exist OR belongs to someone else
}


const COUNSELLING_SQL = `
  SELECT
    id,
    status,
    preferred_slot AS "preferredSlot",
    message,
    mobile,
    created_at     AS "createdAt",
    comparison_id  AS "comparisonId",
    comparison_snapshot -> 'attached' AS attached
  FROM counselling_requests
  WHERE user_id = $1
    AND ($2::text IS NULL OR status = $2)
  ORDER BY created_at DESC, id DESC
  LIMIT $3 OFFSET $4
`;

// Pull college {id, name, city} for both sides of the attached comparison
function collegesFromAttached(attached) {
  if (!attached) return [];
  return [attached.programA, attached.programB]
    .map((p) => p && p.college)
    .filter(Boolean);
}

async function getCounsellingRequests(userId, { status, limit, offset }) {
  const [list, total, pending] = await Promise.all([
    pool.query(COUNSELLING_SQL, [userId, status || null, limit, offset]),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM counselling_requests
       WHERE user_id = $1 AND ($2::text IS NULL OR status = $2)`,
      [userId, status || null]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS pending
       FROM counselling_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    ),
  ]);

  const items = list.rows.map(({ attached, ...row }) => ({
    ...row,
    colleges: collegesFromAttached(attached), // [] for old rows or no comparison
  }));

  return {
    items,
    total: total.rows[0].total,
    pendingCount: pending.rows[0].pending,
    limit,
    offset,
  };
}




module.exports = { getComparisonHistory, deleteComparisonForUser,getCounsellingRequests };