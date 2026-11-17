const pool = require('../config/db');

const MAX_PENDING = 3;

// Slim card for one comparison; $2 = specific id or NULL, $3 = row limit
const COMPARISON_CARD_SQL = `
  SELECT
    cmp.id,
    cmp.match_level AS "matchLevel",
    cmp.created_at  AS "createdAt",
    json_build_object(
      'programId', pa.id, 'displayName', pa.display_name, 'mode', pa.mode,
      'totalFees', pa.total_fees, 'degree', coa.degree, 'branch', coa.branch,
      'specialization', coa.specialization,
      'college', json_build_object('id', ca.id, 'name', ca.name, 'city', ca.city)
    ) AS "programA",
    json_build_object(
      'programId', pb.id, 'displayName', pb.display_name, 'mode', pb.mode,
      'totalFees', pb.total_fees, 'degree', cob.degree, 'branch', cob.branch,
      'specialization', cob.specialization,
      'college', json_build_object('id', cb.id, 'name', cb.name, 'city', cb.city)
    ) AS "programB"
  FROM comparisons cmp
  JOIN college_programs pa ON pa.id = cmp.program_a_id
  JOIN courses  coa        ON coa.id = pa.course_id
  JOIN colleges ca         ON ca.id  = pa.college_id
  JOIN college_programs pb ON pb.id = cmp.program_b_id
  JOIN courses  cob        ON cob.id = pb.course_id
  JOIN colleges cb         ON cb.id  = pb.college_id
  WHERE cmp.user_id = $1
    AND ($2::int IS NULL OR cmp.id = $2)
  ORDER BY cmp.created_at DESC, cmp.id DESC
  LIMIT $3
`;

// Returns { request } on success, or { error: 'USER_NOT_FOUND' | 'LIMIT' | 'COMPARISON_NOT_FOUND' }
async function createCounsellingRequest(userId, { comparisonId, preferredSlot, message, mobile }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock this user's row so two simultaneous submits can't both pass the limit check
    const locked = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (locked.rowCount === 0) {
      await client.query('ROLLBACK');
      return { error: 'USER_NOT_FOUND' };
    }

    // 1. Pending limit
    const { rows: [{ pending }] } = await client.query(
      `SELECT COUNT(*)::int AS pending
       FROM counselling_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (pending >= MAX_PENDING) {
      await client.query('ROLLBACK');
      return { error: 'LIMIT' };
    }

    // 2. Ownership check + snapshot of the attached comparison
    let attached = null;
    if (comparisonId) {
      const r = await client.query(COMPARISON_CARD_SQL, [userId, comparisonId, 1]);
      if (r.rows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'COMPARISON_NOT_FOUND' }; // missing OR someone else's
      }
      attached = r.rows[0];
    }

    // 3. Snapshot of the user's last 3 comparisons
    const recent = (await client.query(COMPARISON_CARD_SQL, [userId, null, 3])).rows;
    const snapshot = { attached, recent };

    // 4. Insert (status defaults to 'pending')
    const { rows } = await client.query(
      `INSERT INTO counselling_requests
         (user_id, comparison_id, preferred_slot, message, mobile, comparison_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id,
                 comparison_id  AS "comparisonId",
                 preferred_slot AS "preferredSlot",
                 message, mobile, status,
                 created_at     AS "createdAt"`,
      [userId, comparisonId || null, preferredSlot, message, mobile, JSON.stringify(snapshot)]
    );

    await client.query('COMMIT');
    return { request: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// POST	/api/admin/counsellors	Add a counsellor


// Returns { counsellor } or { error: 'BAD_SPECIALIZATION' | 'EMAIL_EXISTS', categories? }
async function createCounsellor({ name, email, mobile, specialization, isActive }) {
  // specialization must equal an existing colleges.category, otherwise the
  // booking auto-assignment would never match this counsellor to anything
  if (specialization) {
    const found = await pool.query(
      'SELECT 1 FROM colleges WHERE category = $1 LIMIT 1',
      [specialization]
    );
    if (found.rowCount === 0) {
      const { rows } = await pool.query(
        'SELECT DISTINCT category FROM colleges ORDER BY category'
      );
      return { error: 'BAD_SPECIALIZATION', categories: rows.map((r) => r.category) };
    }
  }

  // The unique index is on lower(email), so the conflict target must match it exactly
  const { rows } = await pool.query(
    `INSERT INTO counsellors (name, email, mobile, specialization, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lower(email)) DO NOTHING
     RETURNING id, name, email, mobile, specialization,
               is_active  AS "isActive",
               created_at AS "createdAt"`,
    [name, email, mobile, specialization, isActive]
  );

  if (rows.length === 0) return { error: 'EMAIL_EXISTS' };
  const counsellor = rows[0];

  // Auto-generate upcoming open slots if counsellor is active
  if (counsellor.isActive) {
    try {
      const { generateSlotsForCounsellor } = require('./slotService');
      await generateSlotsForCounsellor(counsellor.id);
    } catch (slotErr) {
      console.warn('Auto-generation of slots error:', slotErr.message);
    }
  }

  return { counsellor };
}

// GET	/api/admin/counsellors	List counsellors
const SORTS = {
  name:    'c.name ASC, c.id ASC',
  newest:  'c.created_at DESC, c.id DESC',
  // least loaded first, same idea the booking auto-assignment uses
  load:    '"upcomingBookings" ASC, c.name ASC, c.id ASC',
};

// Same WHERE for the list and the count so filters can't drift apart
const LIST_WHERE = `
  WHERE ($1::boolean IS NULL OR c.is_active = $1)
    AND ($2::text    IS NULL OR c.specialization = $2)
    AND ($3::text    IS NULL OR c.name ILIKE '%' || $3 || '%'
                             OR c.email ILIKE '%' || $3 || '%')
`;

async function listCounsellors({ isActive, specialization, q, sort, limit, offset }) {
  const orderBy = SORTS[sort] || SORTS.name; // whitelist, never raw input
  const filters = [isActive ?? null, specialization || null, q || null];

  const [list, count] = await Promise.all([
    pool.query(
      `SELECT
         c.id, c.name, c.email, c.mobile, c.specialization,
         c.is_active  AS "isActive",
         c.created_at AS "createdAt",
         (SELECT COUNT(*)::int
            FROM counselling_bookings b
            JOIN counselling_slots s ON s.id = b.slot_id
           WHERE b.counsellor_id = c.id
             AND b.status = 'confirmed'
             AND s.slot_start > now()) AS "upcomingBookings",
         (SELECT COUNT(*)::int
            FROM counselling_slots s
           WHERE s.counsellor_id = c.id
             AND s.status = 'open'
             AND s.slot_start > now()) AS "openSlots"
       FROM counsellors c
       ${LIST_WHERE}
       ORDER BY ${orderBy}
       LIMIT $4 OFFSET $5`,
      [...filters, limit, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM counsellors c ${LIST_WHERE}`, filters),
  ]);

  return { items: list.rows, total: count.rows[0].total, limit, offset };
}

// PATCH	/api/admin/counsellors/:id	Edit details, or activate/deactivate
// Body key -> column. Only these can ever appear in the SET clause,
// so building the SQL from this map is injection-safe.
const UPDATABLE = {
  name:           'name',
  email:          'email',
  mobile:         'mobile',
  specialization: 'specialization',
  isActive:       'is_active',
};

// Returns { counsellor } or { error: 'NOT_FOUND' | 'BAD_SPECIALIZATION' | 'EMAIL_EXISTS', categories? }
async function updateCounsellor(id, changes) {
  // Same category check as create, only when a non-null specialization is being set
  if (changes.specialization) {
    const found = await pool.query(
      'SELECT 1 FROM colleges WHERE category = $1 LIMIT 1',
      [changes.specialization]
    );
    if (found.rowCount === 0) {
      const { rows } = await pool.query(
        'SELECT DISTINCT category FROM colleges ORDER BY category'
      );
      return { error: 'BAD_SPECIALIZATION', categories: rows.map((r) => r.category) };
    }
  }

  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (key in changes) {
      values.push(changes[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  values.push(id);

  try {
    const { rows } = await pool.query(
      `UPDATE counsellors
       SET ${sets.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, name, email, mobile, specialization,
                 is_active  AS "isActive",
                 created_at AS "createdAt",
                 (SELECT COUNT(*)::int
                    FROM counselling_bookings b
                    JOIN counselling_slots s ON s.id = b.slot_id
                   WHERE b.counsellor_id = counsellors.id
                     AND b.status = 'confirmed'
                     AND s.slot_start > now()) AS "upcomingBookings"`,
      values
    );
    if (rows.length === 0) return { error: 'NOT_FOUND' };
    return { counsellor: rows[0] };
  } catch (err) {
    // 23505 = unique violation, here counsellors_email_uniq (lower(email))
    if (err.code === '23505') return { error: 'EMAIL_EXISTS' };
    throw err;
  }
}



module.exports = {
  createCounsellingRequest,
  MAX_PENDING,
  createCounsellor,
  listCounsellors,
  updateCounsellor,
  COMPARISON_CARD_SQL,
};