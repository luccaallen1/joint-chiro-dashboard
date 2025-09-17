const db = require('./src/db/connection');

async function getClinicData(clinicName) {
  try {
    const result = await db.query(`
      SELECT
        c.name as clinic_name,
        COUNT(DISTINCT conv.id) as total_conversations,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT CASE WHEN conv.engaged = true THEN conv.id END) as engaged_conversations
      FROM clients c
      LEFT JOIN conversations conv ON c.id = conv.client_id
      LEFT JOIN bookings b ON conv.id = b.conversation_id
      LEFT JOIN leads l ON conv.id = l.conversation_id
      WHERE c.name = $1
      GROUP BY c.name
    `, [clinicName]);

    if (result.rows.length === 0) {
      return {
        clinic: clinicName,
        bookings: 0,
        leads: 0,
        engaged: 0,
        found: false
      };
    }

    const data = result.rows[0];
    return {
      clinic: clinicName,
      bookings: parseInt(data.total_bookings),
      leads: parseInt(data.total_leads),
      engaged: parseInt(data.engaged_conversations),
      found: true
    };
  } catch (error) {
    console.error('Error fetching clinic data:', error);
    return {
      clinic: clinicName,
      bookings: 0,
      leads: 0,
      engaged: 0,
      error: error.message,
      found: false
    };
  }
}

// If called directly from command line
if (require.main === module) {
  const clinicName = process.argv[2];
  if (!clinicName) {
    console.error('Usage: node get-clinic-data.js "Clinic Name"');
    process.exit(1);
  }

  getClinicData(clinicName)
    .then(data => {
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { getClinicData };