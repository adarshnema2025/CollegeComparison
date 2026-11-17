const pool = require('../config/db');
const { COMPARISON_CARD_SQL } = require('./counsellingService');


//POST request for a booking a particular time slot after checking if its free or not


const MAX_UPCOMING = 2; // active future bookings per user

// $1 = slot time, $2 = college category of the attached comparison (or NULL)
// Preference: specialist match, then generalist, then anyone; then least loaded.
// SKIP LOCKED: a slot another transaction is claiming is skipped, next one is used.
const PICK_SLOT_SQL = `
  SELECT s.id            AS "slotId",
         s.counsellor_id AS "counsellorId",
         s.slot_start    AS "slotStart",
         s.slot_end      AS "slotEnd",
         c.name          AS "counsellorName"
  FROM counselling_slots s
  JOIN counsellors c ON c.id = s.counsellor_id AND c.is_active
  WHERE s.slot_start = $1::timestamptz
    AND s.status = 'open'
  ORDER BY
    CASE
      WHEN $2::text IS NOT NULL AND c.specialization = $2::text THEN 0
      WHEN c.specialization IS NULL THEN 1
      ELSE 2
    END,
    (SELECT COUNT(*)
       FROM counselling_bookings b
       JOIN counselling_slots s2 ON s2.id = b.slot_id
      WHERE b.counsellor_id = c.id
        AND b.status = 'confirmed'
        AND s2.slot_start > now()) ASC,
    c.id
  LIMIT 1
  FOR UPDATE OF s SKIP LOCKED
`;

// Returns { booking } or { error: 'USER_NOT_FOUND' | 'LIMIT' | 'COMPARISON_NOT_FOUND' | 'SLOT_TAKEN' }
async function createBooking(userId, { slot, mobile, message, comparisonId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Serialize this user's bookings so the limit check can't be raced
    const locked = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (locked.rowCount === 0) {
      await client.query('ROLLBACK');
      return { error: 'USER_NOT_FOUND' };
    }

    // 1. Upcoming-booking limit
    const { rows: [{ upcoming }] } = await client.query(
      `SELECT COUNT(*)::int AS upcoming
       FROM counselling_bookings b
       JOIN counselling_slots s ON s.id = b.slot_id
       WHERE b.user_id = $1 AND b.status = 'confirmed' AND s.slot_start > now()`,
      [userId]
    );
    if (upcoming >= MAX_UPCOMING) {
      await client.query('ROLLBACK');
      return { error: 'LIMIT' };
    }

    // 2. Ownership check, snapshot, and category for specialist matching
    let attached = null;
    let category = null;
    if (comparisonId) {
      const r = await client.query(COMPARISON_CARD_SQL, [userId, comparisonId, 1]);
      if (r.rows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'COMPARISON_NOT_FOUND' }; // missing OR someone else's
      }
      attached = r.rows[0];

      const cat = await client.query(
        `SELECT c.category
         FROM comparisons cmp
         JOIN college_programs pa ON pa.id = cmp.program_a_id
         JOIN colleges c          ON c.id  = pa.college_id
         WHERE cmp.id = $1 AND cmp.user_id = $2`,
        [comparisonId, userId]
      );
      category = cat.rows[0]?.category || null;
    }
    const recent = (await client.query(COMPARISON_CARD_SQL, [userId, null, 3])).rows;

    // 3. Claim a slot (this is where the counsellor is auto-assigned)
    const picked = (await client.query(PICK_SLOT_SQL, [slot, category])).rows[0];
    if (!picked) {
      await client.query('ROLLBACK');
      return { error: 'SLOT_TAKEN' };
    }
    await client.query(`UPDATE counselling_slots SET status = 'booked' WHERE id = $1`, [picked.slotId]);

    // 4. Insert the booking
    const { rows: [b] } = await client.query(
      `INSERT INTO counselling_bookings
         (slot_id, counsellor_id, user_id, comparison_id, mobile, message, comparison_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, status, created_at AS "createdAt"`,
      [picked.slotId, picked.counsellorId, userId, comparisonId || null, mobile, message,
       JSON.stringify({ attached, recent })]
    );

    await client.query('COMMIT');
    return {
      booking: {
        id: b.id,
        status: b.status,
        slotStart: picked.slotStart,
        slotEnd: picked.slotEnd,
        counsellor: { id: picked.counsellorId, name: picked.counsellorName },
        comparisonId: comparisonId || null,
        createdAt: b.createdAt,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}


//GET request for seeing the available slots with buffer time and for next 3 days


const LEAD_HOURS = 2;
const WINDOW_DAYS = 3;

const AVAILABILITY_SQL = `
  SELECT DISTINCT s.slot_start AS "start", s.slot_end AS "end"
  FROM counselling_slots s
  JOIN counsellors c ON c.id = s.counsellor_id AND c.is_active
  WHERE s.status = 'open'
    AND s.slot_start >= $1::timestamptz
    AND s.slot_start <  $2::timestamptz
  ORDER BY s.slot_start
`;

async function getAvailability() {
  const from = new Date(Date.now() + LEAD_HOURS * 60 * 60 * 1000);
  const to   = new Date(Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { rows } = await pool.query(AVAILABILITY_SQL, [from.toISOString(), to.toISOString()]);
  return { from, to, slots: rows };
}

// module.exports = { getAvailability };



//GET	/api/counselling/bookings/me	List the user’s bookings (upcoming and past)

// Shared by the list and the count so the filter can't drift between them
const MY_BOOKINGS_FROM = `
  FROM counselling_bookings b
  JOIN counselling_slots s ON s.id = b.slot_id
  JOIN counsellors c       ON c.id = b.counsellor_id
  WHERE b.user_id = $1
    AND ($2::text IS NULL
         OR ($2 = 'upcoming' AND b.status = 'confirmed' AND s.slot_start >  now())
         OR ($2 = 'past'     AND NOT (b.status = 'confirmed' AND s.slot_start > now())))
`;

async function getMyBookings(userId, { when, limit, offset }) {
  // soonest first for upcoming, newest first for past / mixed
  const orderBy = when === 'upcoming'
    ? 's.slot_start ASC,  b.id ASC'
    : 's.slot_start DESC, b.id DESC';

  const [list, count] = await Promise.all([
    pool.query(
      `SELECT
         b.id,
         b.status,
         b.mobile,
         b.message,
         b.comparison_id AS "comparisonId",
         b.created_at    AS "createdAt",
         s.slot_start    AS "slotStart",
         s.slot_end      AS "slotEnd",
         json_build_object('id', c.id, 'name', c.name) AS counsellor,
         (b.status = 'confirmed' AND s.slot_start > now()) AS "isUpcoming"
       ${MY_BOOKINGS_FROM}
       ORDER BY ${orderBy}
       LIMIT $3 OFFSET $4`,
      [userId, when || null, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total ${MY_BOOKINGS_FROM}`,
      [userId, when || null]
    ),
  ]);

  return { items: list.rows, total: count.rows[0].total, limit, offset };
}

// GET    /api/counselling/bookings/:id    Details of one booking
const BOOKING_DETAIL_SQL = `
  SELECT
    b.id,
    b.status,
    b.mobile,
    b.message,
    b.comparison_id AS "comparisonId",
    b.created_at    AS "createdAt",
    s.slot_start    AS "slotStart",
    s.slot_end      AS "slotEnd",
    json_build_object('id', c.id, 'name', c.name) AS counsellor,
    (b.status = 'confirmed' AND s.slot_start > now()) AS "isUpcoming",
    b.comparison_snapshot -> 'attached' AS comparison
  FROM counselling_bookings b
  JOIN counselling_slots s ON s.id = b.slot_id
  JOIN counsellors c       ON c.id = b.counsellor_id
  WHERE b.id = $1 AND b.user_id = $2
`;

// Ownership is in the WHERE clause: wrong owner = no row
async function getBookingForUser(id, userId) {
  const { rows } = await pool.query(BOOKING_DETAIL_SQL, [id, userId]);
  return rows[0] || null; // null => controller returns 404
}

// PATCH	/api/counselling/bookings/:id/cancel	Cancel a booking, which frees the slot
const CANCEL_BEFORE_MINUTES = 0; // set to e.g. 60 to block cancellations within an hour of the session

// Returns { booking } or { error: 'NOT_FOUND' | 'NOT_CANCELLABLE' | 'TOO_LATE', status? }
async function cancelBooking(id, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ownership is in the WHERE clause. FOR UPDATE locks the booking and its slot,
    // so two simultaneous cancels (or a cancel racing anything else) are serialized.
    const { rows } = await client.query(
      `SELECT b.id, b.status, b.slot_id,
              s.slot_start AS "slotStart", s.slot_end AS "slotEnd"
       FROM counselling_bookings b
       JOIN counselling_slots s ON s.id = b.slot_id
       WHERE b.id = $1 AND b.user_id = $2
       FOR UPDATE OF b, s`,
      [id, userId]
    );
    const b = rows[0];
    if (!b) {
      await client.query('ROLLBACK');
      return { error: 'NOT_FOUND' }; // missing OR someone else's
    }

    // Only a confirmed booking can be cancelled
    if (b.status !== 'confirmed') {
      await client.query('ROLLBACK');
      return { error: 'NOT_CANCELLABLE', status: b.status };
    }

    // Can't cancel a session that has started, or is inside the cutoff
    const cutoff = new Date(Date.now() + CANCEL_BEFORE_MINUTES * 60 * 1000);
    if (new Date(b.slotStart) <= cutoff) {
      await client.query('ROLLBACK');
      return { error: 'TOO_LATE' };
    }

    // 1. Cancel the booking
    await client.query(
      `UPDATE counselling_bookings SET status = 'cancelled' WHERE id = $1`,
      [b.id]
    );

    // 2. Free the slot. The status guard leaves a slot an admin has since
    //    marked 'blocked' untouched.
    await client.query(
      `UPDATE counselling_slots SET status = 'open'
       WHERE id = $1 AND status = 'booked'`,
      [b.slot_id]
    );

    await client.query('COMMIT');
    return {
      booking: {
        id: b.id,
        status: 'cancelled',
        slotStart: b.slotStart,
        slotEnd: b.slotEnd,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}




module.exports = { createBooking, MAX_UPCOMING, getMyBookings ,getAvailability,getBookingForUser,cancelBooking};

