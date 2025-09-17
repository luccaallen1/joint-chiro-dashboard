const db = require('./src/db/connection');
const fs = require('fs');
const path = require('path');

async function generateAllClinicData() {
  console.log('🔄 Generating clinic data for all clinics...');

  try {
    // Get all clinic names (excluding test entries)
    const clinicsResult = await db.query(`
      SELECT name
      FROM clients
      WHERE name NOT IN ('Default Clinic', 'Demo Clinic', 'Test', 'Unknown Clinic', 'DB', 'EB', 'IB', 'CB', 'TB', 'WB', 'mybot')
      ORDER BY name
    `);

    const clinics = clinicsResult.rows.map(row => row.name);
    console.log(`📊 Found ${clinics.length} clinics to process`);

    const clinicData = {};
    let processed = 0;

    // Get data for each clinic
    for (const clinicName of clinics) {
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

      if (result.rows.length > 0) {
        const data = result.rows[0];
        clinicData[clinicName] = {
          bookings: parseInt(data.total_bookings),
          leads: parseInt(data.total_leads),
          engaged: parseInt(data.engaged_conversations),
          conversations: parseInt(data.total_conversations)
        };
      } else {
        clinicData[clinicName] = {
          bookings: 0,
          leads: 0,
          engaged: 0,
          conversations: 0
        };
      }

      processed++;
      if (processed % 10 === 0) {
        console.log(`   Processed ${processed}/${clinics.length} clinics...`);
      }
    }

    // Add metadata
    const dataWithMetadata = {
      generatedAt: new Date().toISOString(),
      totalClinics: clinics.length,
      clinics: clinicData
    };

    // Write to dashboard's public folder
    const outputPath = path.join(__dirname, 'dashboard', 'public', 'clinic-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataWithMetadata, null, 2));

    console.log(`✅ Generated clinic data for ${clinics.length} clinics`);
    console.log(`📁 Saved to: ${outputPath}`);

    // Show some sample data
    console.log('\n📈 Sample Data:');
    const sampleClinics = Object.keys(clinicData).slice(0, 5);
    sampleClinics.forEach(clinic => {
      const data = clinicData[clinic];
      console.log(`   ${clinic}: ${data.bookings} bookings, ${data.leads} leads, ${data.engaged} engaged`);
    });

    // Show totals
    const totals = Object.values(clinicData).reduce((acc, clinic) => ({
      bookings: acc.bookings + clinic.bookings,
      leads: acc.leads + clinic.leads,
      engaged: acc.engaged + clinic.engaged,
      conversations: acc.conversations + clinic.conversations
    }), { bookings: 0, leads: 0, engaged: 0, conversations: 0 });

    console.log('\n🎯 TOTALS:');
    console.log(`   Total Bookings: ${totals.bookings}`);
    console.log(`   Total Leads: ${totals.leads}`);
    console.log(`   Total Engaged: ${totals.engaged}`);
    console.log(`   Total Conversations: ${totals.conversations}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating clinic data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  generateAllClinicData();
}

module.exports = { generateAllClinicData };