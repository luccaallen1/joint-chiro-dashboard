const db = require('./src/db/connection');
const fs = require('fs');
const path = require('path');

async function generateMonthlyClinicData() {
  console.log('🔄 Generating monthly clinic data for all clinics...');

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

    // Get date range from data
    const dateRangeResult = await db.query(`
      SELECT
        MIN(created_at) as min_date,
        MAX(created_at) as max_date
      FROM conversations
    `);

    const { min_date, max_date } = dateRangeResult.rows[0];
    console.log(`📅 Date range: ${new Date(min_date).toLocaleDateString()} to ${new Date(max_date).toLocaleDateString()}`);

    // Generate month list
    const months = [];
    const current = new Date(min_date);
    const end = new Date(max_date);

    while (current <= end) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: `${current.toLocaleString('default', { month: 'long' })} ${current.getFullYear()}`
      });
      current.setMonth(current.getMonth() + 1);
    }

    console.log(`📅 Processing ${months.length} months of data`);

    const monthlyData = {};

    // Process each month
    for (const { year, month, label } of months) {
      monthlyData[`${year}-${String(month).padStart(2, '0')}`] = {
        label,
        year,
        month,
        totals: {
          bookings: 0,
          leads: 0,
          engaged: 0,
          conversations: 0
        },
        clinics: {}
      };
    }

    // Get data for each clinic and month combination
    let processed = 0;
    for (const clinicName of clinics) {
      // Get monthly breakdown for this clinic
      const monthlyResult = await db.query(`
        SELECT
          EXTRACT(YEAR FROM conv.created_at) as year,
          EXTRACT(MONTH FROM conv.created_at) as month,
          COUNT(DISTINCT conv.id) as total_conversations,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT l.id) as total_leads,
          COUNT(DISTINCT CASE WHEN conv.engaged = true THEN conv.id END) as engaged_conversations
        FROM clients c
        LEFT JOIN conversations conv ON c.id = conv.client_id
        LEFT JOIN bookings b ON conv.id = b.conversation_id
        LEFT JOIN leads l ON conv.id = l.conversation_id
        WHERE c.name = $1
        GROUP BY EXTRACT(YEAR FROM conv.created_at), EXTRACT(MONTH FROM conv.created_at)
        ORDER BY year, month
      `, [clinicName]);

      // Get automation breakdown for this clinic (monthly)
      const automationMonthlyResult = await db.query(`
        SELECT
          EXTRACT(YEAR FROM conv.created_at) as year,
          EXTRACT(MONTH FROM conv.created_at) as month,
          a.code as automation_code,
          COUNT(DISTINCT conv.id) as total_conversations,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT l.id) as total_leads,
          COUNT(DISTINCT CASE WHEN conv.engaged = true THEN conv.id END) as engaged_conversations
        FROM clients c
        LEFT JOIN conversations conv ON c.id = conv.client_id
        LEFT JOIN automations a ON conv.automation_id = a.id
        LEFT JOIN bookings b ON conv.id = b.conversation_id
        LEFT JOIN leads l ON conv.id = l.conversation_id
        WHERE c.name = $1 AND a.code IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM conv.created_at), EXTRACT(MONTH FROM conv.created_at), a.code
        ORDER BY year, month, automation_code
      `, [clinicName]);

      // Store monthly data for this clinic
      for (const row of monthlyResult.rows) {
        const monthKey = `${row.year}-${String(row.month).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].clinics[clinicName] = {
            bookings: parseInt(row.total_bookings) || 0,
            leads: parseInt(row.total_leads) || 0,
            engaged: parseInt(row.engaged_conversations) || 0,
            conversations: parseInt(row.total_conversations) || 0,
            automations: {}
          };

          // Update totals
          monthlyData[monthKey].totals.bookings += parseInt(row.total_bookings) || 0;
          monthlyData[monthKey].totals.leads += parseInt(row.total_leads) || 0;
          monthlyData[monthKey].totals.engaged += parseInt(row.engaged_conversations) || 0;
          monthlyData[monthKey].totals.conversations += parseInt(row.total_conversations) || 0;
        }
      }

      // Add automation breakdowns to monthly data
      for (const row of automationMonthlyResult.rows) {
        const monthKey = `${row.year}-${String(row.month).padStart(2, '0')}`;
        if (monthlyData[monthKey] && monthlyData[monthKey].clinics[clinicName]) {
          monthlyData[monthKey].clinics[clinicName].automations[row.automation_code] = {
            bookings: parseInt(row.total_bookings) || 0,
            leads: parseInt(row.total_leads) || 0,
            engaged: parseInt(row.engaged_conversations) || 0,
            conversations: parseInt(row.total_conversations) || 0
          };
        }
      }

      processed++;
      if (processed % 10 === 0) {
        console.log(`   Processed ${processed}/${clinics.length} clinics...`);
      }
    }

    // Also get overall data for each clinic (all time)
    const allTimeData = {};
    for (const clinicName of clinics) {
      const result = await db.query(`
        SELECT
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

      // Get automation breakdown for this clinic (all time)
      const automationResult = await db.query(`
        SELECT
          a.code as automation_code,
          COUNT(DISTINCT conv.id) as total_conversations,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT l.id) as total_leads,
          COUNT(DISTINCT CASE WHEN conv.engaged = true THEN conv.id END) as engaged_conversations
        FROM clients c
        LEFT JOIN conversations conv ON c.id = conv.client_id
        LEFT JOIN automations a ON conv.automation_id = a.id
        LEFT JOIN bookings b ON conv.id = b.conversation_id
        LEFT JOIN leads l ON conv.id = l.conversation_id
        WHERE c.name = $1 AND a.code IS NOT NULL
        GROUP BY a.code
        ORDER BY automation_code
      `, [clinicName]);

      if (result.rows.length > 0) {
        const data = result.rows[0];
        allTimeData[clinicName] = {
          bookings: parseInt(data.total_bookings),
          leads: parseInt(data.total_leads),
          engaged: parseInt(data.engaged_conversations),
          conversations: parseInt(data.total_conversations),
          automations: {}
        };

        // Add automation breakdowns
        for (const automationRow of automationResult.rows) {
          allTimeData[clinicName].automations[automationRow.automation_code] = {
            bookings: parseInt(automationRow.total_bookings) || 0,
            leads: parseInt(automationRow.total_leads) || 0,
            engaged: parseInt(automationRow.engaged_conversations) || 0,
            conversations: parseInt(automationRow.total_conversations) || 0
          };
        }
      }
    }

    // Calculate overall totals
    const overallTotals = Object.values(allTimeData).reduce((acc, clinic) => ({
      bookings: acc.bookings + clinic.bookings,
      leads: acc.leads + clinic.leads,
      engaged: acc.engaged + clinic.engaged,
      conversations: acc.conversations + clinic.conversations
    }), { bookings: 0, leads: 0, engaged: 0, conversations: 0 });

    // Add metadata
    const dataWithMetadata = {
      generatedAt: new Date().toISOString(),
      totalClinics: clinics.length,
      dateRange: {
        start: min_date,
        end: max_date
      },
      months: Object.keys(monthlyData).sort(),
      allTime: {
        totals: overallTotals,
        clinics: allTimeData
      },
      monthly: monthlyData
    };

    // Write to dashboard's public folder
    const outputPath = path.join(__dirname, 'dashboard', 'public', 'monthly-clinic-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataWithMetadata, null, 2));

    console.log(`✅ Generated monthly clinic data`);
    console.log(`📁 Saved to: ${outputPath}`);

    // Show summary
    console.log('\n📈 Summary:');
    console.log(`   Total Clinics: ${clinics.length}`);
    console.log(`   Total Months: ${months.length}`);
    console.log(`   All-Time Totals:`);
    console.log(`     - Bookings: ${overallTotals.bookings}`);
    console.log(`     - Leads: ${overallTotals.leads}`);
    console.log(`     - Engaged: ${overallTotals.engaged}`);
    console.log(`     - Conversations: ${overallTotals.conversations}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating monthly clinic data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  generateMonthlyClinicData();
}

module.exports = { generateMonthlyClinicData };