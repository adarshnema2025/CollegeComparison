const pool = require('../config/db');

const STANDARD_TIMES = [
  { start: '10:00:00', end: '10:30:00' },
  { start: '11:30:00', end: '12:00:00' },
  { start: '14:00:00', end: '14:30:00' },
  { start: '15:30:00', end: '16:00:00' },
  { start: '17:00:00', end: '17:30:00' },
  { start: '18:30:00', end: '19:00:00' },
];

/**
 * Generate open slots for a specific counsellor for the next `daysAhead` days in IST (GMT+5:30).
 */
async function generateSlotsForCounsellor(counsellorId, daysAhead = 7) {
  const client = await pool.connect();
  try {
    const inserted = [];
    const now = new Date();

    // Generate slots for each day
    for (let day = 0; day <= daysAhead; day++) {
      // Calculate target date in IST
      const targetDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Calcutta' }); // YYYY-MM-DD

      for (const time of STANDARD_TIMES) {
        const startIso = `${dateStr}T${time.start}+05:30`;
        const endIso = `${dateStr}T${time.end}+05:30`;

        // Only generate slots in the future (at least 30 mins ahead)
        if (new Date(startIso).getTime() > now.getTime() + 30 * 60 * 1000) {
          const res = await client.query(
            `INSERT INTO counselling_slots (counsellor_id, slot_start, slot_end, status)
             VALUES ($1, $2::timestamptz, $3::timestamptz, 'open')
             ON CONFLICT (counsellor_id, slot_start) DO NOTHING
             RETURNING id, counsellor_id, slot_start, slot_end, status`,
            [counsellorId, startIso, endIso]
          );
          if (res.rows.length > 0) {
            inserted.push(res.rows[0]);
          }
        }
      }
    }
    return inserted;
  } finally {
    client.release();
  }
}

/**
 * Generate slots for all active counsellors.
 */
async function generateSlotsForAllCounsellors(daysAhead = 7) {
  const { rows: counsellors } = await pool.query(
    'SELECT id, name FROM counsellors WHERE is_active = true'
  );
  let totalInserted = 0;
  for (const c of counsellors) {
    const slots = await generateSlotsForCounsellor(c.id, daysAhead);
    totalInserted += slots.length;
  }
  return { activeCounsellors: counsellors.length, totalSlotsAdded: totalInserted };
}

module.exports = {
  generateSlotsForCounsellor,
  generateSlotsForAllCounsellors,
  STANDARD_TIMES,
};
