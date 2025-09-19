const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkClinics() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT l.name as clinic, COUNT(c.id) as conversations
      FROM locations l
      LEFT JOIN conversations c ON l.id = c.location_id
      GROUP BY l.name
      ORDER BY conversations DESC
      LIMIT 20
    `);

    console.log(`📍 Found ${result.rows.length} clinics with data:`);
    console.log('========================================');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.clinic}: ${row.conversations} conversations`);
    });

    const totalClinics = await pool.query('SELECT COUNT(DISTINCT name) as count FROM locations');
    console.log(`\n📊 Total unique clinics in database: ${totalClinics.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkClinics();