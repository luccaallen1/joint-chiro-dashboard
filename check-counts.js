const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCounts() {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM conversations WHERE lead_created = true) as leads,
        (SELECT COUNT(*) FROM conversations WHERE engaged = true) as engaged
    `);

    console.log('📊 DATABASE COUNTS:');
    console.log(`- Conversations: ${result.rows[0].conversations}`);
    console.log(`- Bookings: ${result.rows[0].bookings}`);
    console.log(`- Leads: ${result.rows[0].leads}`);
    console.log(`- Engaged: ${result.rows[0].engaged}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCounts();