const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSimpleQuery() {
  try {
    console.log('Testing simple filtering for Oxford clinic...');

    // Test 1: Simple count for Oxford
    const oxfordQuery = `
      SELECT COUNT(*) as conversations
      FROM conversations c
      JOIN locations l ON c.location_id = l.id
      WHERE l.name = $1
    `;

    const oxfordResult = await pool.query(oxfordQuery, ['Oxford']);
    console.log('Oxford conversations:', oxfordResult.rows[0].conversations);

    // Test 2: Simple booking count for Oxford
    const bookingsQuery = `
      SELECT COUNT(*) as bookings
      FROM bookings b
      JOIN locations l ON b.location_id = l.id
      WHERE l.name = $1
    `;

    const bookingsResult = await pool.query(bookingsQuery, ['Oxford']);
    console.log('Oxford bookings:', bookingsResult.rows[0].bookings);

    // Test 3: September filter
    const septQuery = `
      SELECT COUNT(*) as september_conversations
      FROM conversations c
      WHERE DATE_PART('month', c.created_at) = 9
    `;

    const septResult = await pool.query(septQuery);
    console.log('September conversations:', septResult.rows[0].september_conversations);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

testSimpleQuery();