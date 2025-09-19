const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function deleteAllData() {
  try {
    console.log('🗑️  DELETING ALL DATA FROM DATABASE...\n');

    // Get counts before deletion
    const beforeCounts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM leads) as leads,
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM locations) as locations,
        (SELECT COUNT(*) FROM automations) as automations,
        (SELECT COUNT(*) FROM clients) as clients
    `);

    console.log('BEFORE DELETION:');
    console.log(`- Conversations: ${beforeCounts.rows[0].conversations}`);
    console.log(`- Bookings: ${beforeCounts.rows[0].bookings}`);
    console.log(`- Leads: ${beforeCounts.rows[0].leads}`);
    console.log(`- Customers: ${beforeCounts.rows[0].customers}`);
    console.log(`- Locations: ${beforeCounts.rows[0].locations}`);
    console.log(`- Automations: ${beforeCounts.rows[0].automations}`);
    console.log(`- Clients: ${beforeCounts.rows[0].clients}\n`);

    // Delete in proper order (respecting foreign key constraints)
    console.log('Deleting bookings...');
    await pool.query('DELETE FROM bookings');

    console.log('Deleting leads...');
    await pool.query('DELETE FROM leads');

    console.log('Deleting conversations...');
    await pool.query('DELETE FROM conversations');

    console.log('Deleting customers...');
    await pool.query('DELETE FROM customers');

    console.log('Deleting locations...');
    await pool.query('DELETE FROM locations');

    console.log('Deleting automations...');
    await pool.query('DELETE FROM automations');

    console.log('Deleting clients...');
    await pool.query('DELETE FROM clients');

    // Verify deletion
    const afterCounts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM leads) as leads,
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM locations) as locations,
        (SELECT COUNT(*) FROM automations) as automations,
        (SELECT COUNT(*) FROM clients) as clients
    `);

    console.log('\nAFTER DELETION:');
    console.log(`- Conversations: ${afterCounts.rows[0].conversations}`);
    console.log(`- Bookings: ${afterCounts.rows[0].bookings}`);
    console.log(`- Leads: ${afterCounts.rows[0].leads}`);
    console.log(`- Customers: ${afterCounts.rows[0].customers}`);
    console.log(`- Locations: ${afterCounts.rows[0].locations}`);
    console.log(`- Automations: ${afterCounts.rows[0].automations}`);
    console.log(`- Clients: ${afterCounts.rows[0].clients}`);

    console.log('\n✅ ALL DATA DELETED SUCCESSFULLY!');
    console.log('Ready for fresh import from Airtable.\n');

  } catch (error) {
    console.error('❌ Error deleting data:', error);
  } finally {
    await pool.end();
  }
}

deleteAllData();