const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getAllClinics() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT name
      FROM locations
      ORDER BY name
    `);

    const clinics = result.rows.map(row => `{ id: "${row.name}", name: "${row.name}" }`);

    console.log('const clinics = [');
    console.log('  { id: "all", name: "All Locations" },');
    clinics.forEach(clinic => {
      console.log(`  ${clinic},`);
    });
    console.log('];');

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getAllClinics();