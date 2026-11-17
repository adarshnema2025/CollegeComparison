const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./config/db');
const { generateSlotsForCounsellor } = require('./service/slotService');

const DEFAULT_COUNSELLORS = [
  {
    name: 'Dr. Arvind Subramanian',
    email: 'arvind@collegecomparison.com',
    mobile: '9876543211',
    specialization: 'engineering',
    isActive: true,
  },
  {
    name: 'Pooja Malhotra',
    email: 'pooja@collegecomparison.com',
    mobile: '9876543212',
    specialization: 'management',
    isActive: true,
  },
  {
    name: 'Vikram Rathore',
    email: 'vikram@collegecomparison.com',
    mobile: '9876543213',
    specialization: 'engineering',
    isActive: true,
  },
];

async function seedCounsellors() {
  console.log('Seeding initial counsellors...');
  for (const c of DEFAULT_COUNSELLORS) {
    const existing = await pool.query(
      'SELECT id, name FROM counsellors WHERE lower(email) = lower($1)',
      [c.email]
    );

    let counsellorId;
    if (existing.rows.length === 0) {
      const res = await pool.query(
        `INSERT INTO counsellors (name, email, mobile, specialization, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [c.name, c.email, c.mobile, c.specialization, c.isActive]
      );
      counsellorId = res.rows[0].id;
      console.log(`Created counsellor: ${c.name} (id: ${counsellorId})`);
    } else {
      counsellorId = existing.rows[0].id;
      await pool.query(
        `UPDATE counsellors
         SET name = $1, mobile = $2, specialization = $3, is_active = $4
         WHERE id = $5`,
        [c.name, c.mobile, c.specialization, c.isActive, counsellorId]
      );
      console.log(`Updated counsellor: ${c.name} (id: ${counsellorId})`);
    }

    const slots = await generateSlotsForCounsellor(counsellorId, 5);
    console.log(`Generated ${slots.length} upcoming slots for ${c.name}`);
  }
  console.log('Seeding finished successfully.');
  process.exit(0);
}

seedCounsellors().catch((err) => {
  console.error('Error seeding counsellors:', err);
  process.exit(1);
});
