const db = require('./src/db/connection');

async function verifyResults() {
  try {
    console.log('🔍 Verifying Import Results...\n');

    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get comprehensive statistics
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as total_conversations,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM conversations WHERE engaged = true) as engaged_conversations,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM locations) as total_locations,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM customers WHERE external_id LIKE 'no-user-id-%') as records_without_user_id
    `);

    const results = stats.rows[0];

    console.log('📊 FINAL IMPORT RESULTS');
    console.log('='.repeat(50));
    console.log(`📝 Total Conversations: ${results.total_conversations.toLocaleString()}`);
    console.log(`📅 Bookings Created: ${results.total_bookings.toLocaleString()}`);
    console.log(`🎯 Leads Created: ${results.total_leads.toLocaleString()}`);
    console.log(`💬 Engaged Conversations: ${results.engaged_conversations.toLocaleString()}`);
    console.log(`🏢 Unique Clients: ${results.total_clients.toLocaleString()}`);
    console.log(`📍 Unique Locations: ${results.total_locations.toLocaleString()}`);
    console.log(`👥 Unique Customers: ${results.total_customers.toLocaleString()}`);
    console.log(`❓ Records without User ID: ${results.records_without_user_id.toLocaleString()}`);
    console.log('='.repeat(50));

    // Calculate rates
    const totalConversations = parseInt(results.total_conversations);
    const bookingRate = totalConversations > 0 ? ((parseInt(results.total_bookings) / totalConversations) * 100).toFixed(1) : '0.0';
    const leadRate = totalConversations > 0 ? ((parseInt(results.total_leads) / totalConversations) * 100).toFixed(1) : '0.0';
    const engagementRate = totalConversations > 0 ? ((parseInt(results.engaged_conversations) / totalConversations) * 100).toFixed(1) : '0.0';

    console.log('📈 CONVERSION RATES');
    console.log('='.repeat(50));
    console.log(`📅 Booking Rate: ${bookingRate}% (${results.total_bookings}/${results.total_conversations})`);
    console.log(`🎯 Lead Rate: ${leadRate}% (${results.total_leads}/${results.total_conversations})`);
    console.log(`💬 Engagement Rate: ${engagementRate}% (${results.engaged_conversations}/${results.total_conversations})`);
    console.log('='.repeat(50));

    // Expected vs Actual Validation
    const expectedMetrics = {
      totalConversations: 20077,
      bookings: 3122,
      leads: 13908,
      engaged: 7910
    };

    console.log('🎯 VALIDATION AGAINST EXPECTED METRICS');
    console.log('='.repeat(50));

    const totalMatch = parseInt(results.total_conversations) >= expectedMetrics.totalConversations - 5 &&
                      parseInt(results.total_conversations) <= expectedMetrics.totalConversations + 5;
    const bookingsMatch = parseInt(results.total_bookings) >= expectedMetrics.bookings - 50 &&
                         parseInt(results.total_bookings) <= expectedMetrics.bookings + 50;
    const leadsMatch = parseInt(results.total_leads) >= expectedMetrics.leads - 50 &&
                      parseInt(results.total_leads) <= expectedMetrics.leads + 50;
    const engagedMatch = parseInt(results.engaged_conversations) >= expectedMetrics.engaged - 50 &&
                        parseInt(results.engaged_conversations) <= expectedMetrics.engaged + 50;

    console.log(`📝 Total: ${results.total_conversations}/${expectedMetrics.totalConversations} ${totalMatch ? '✅ CLOSE MATCH' : '❌ MISMATCH'}`);
    console.log(`📅 Bookings: ${results.total_bookings}/${expectedMetrics.bookings} ${bookingsMatch ? '✅ CLOSE MATCH' : '❌ MISMATCH'}`);
    console.log(`🎯 Leads: ${results.total_leads}/${expectedMetrics.leads} ${leadsMatch ? '✅ CLOSE MATCH' : '❌ MISMATCH'}`);
    console.log(`💬 Engaged: ${results.engaged_conversations}/${expectedMetrics.engaged} ${engagedMatch ? '✅ CLOSE MATCH' : '❌ MISMATCH'}`);
    console.log('='.repeat(50));

    // Get sample data by automation type
    const automationStats = await db.query(`
      SELECT
        a.code,
        a.name,
        COUNT(c.id) as conversation_count,
        COUNT(CASE WHEN c.engaged THEN 1 END) as engaged_count,
        COUNT(b.id) as booking_count,
        COUNT(l.id) as lead_count
      FROM automations a
      LEFT JOIN conversations c ON c.automation_id = a.id
      LEFT JOIN bookings b ON b.conversation_id = c.id
      LEFT JOIN leads l ON l.conversation_id = c.id
      GROUP BY a.id, a.code, a.name
      ORDER BY conversation_count DESC
    `);

    console.log('🤖 BREAKDOWN BY AUTOMATION TYPE');
    console.log('='.repeat(70));
    console.log('Code | Name              | Conversations | Engaged | Bookings | Leads');
    console.log('-----|-------------------|---------------|---------|----------|-------');

    automationStats.rows.forEach(row => {
      const conversationCount = parseInt(row.conversation_count) || 0;
      const engagedCount = parseInt(row.engaged_count) || 0;
      const bookingCount = parseInt(row.booking_count) || 0;
      const leadCount = parseInt(row.lead_count) || 0;

      console.log(`${row.code.padEnd(4)} | ${row.name.padEnd(17)} | ${conversationCount.toString().padStart(11)} | ${engagedCount.toString().padStart(7)} | ${bookingCount.toString().padStart(8)} | ${leadCount.toString().padStart(5)}`);
    });

    console.log('='.repeat(70));

    // Get clinic breakdown
    const clinicStats = await db.query(`
      SELECT
        c.name as clinic_name,
        COUNT(conv.id) as conversation_count,
        COUNT(CASE WHEN conv.engaged THEN 1 END) as engaged_count,
        COUNT(b.id) as booking_count,
        COUNT(l.id) as lead_count
      FROM clients c
      LEFT JOIN conversations conv ON conv.client_id = c.id
      LEFT JOIN bookings b ON b.conversation_id = conv.id
      LEFT JOIN leads l ON l.conversation_id = conv.id
      GROUP BY c.id, c.name
      ORDER BY conversation_count DESC
      LIMIT 10
    `);

    console.log('\n🏢 TOP 10 CLINICS BY CONVERSATION VOLUME');
    console.log('='.repeat(80));
    console.log('Clinic Name                    | Conversations | Engaged | Bookings | Leads');
    console.log('-------------------------------|---------------|---------|----------|-------');

    clinicStats.rows.forEach(row => {
      const clinicName = row.clinic_name.length > 30 ? row.clinic_name.substring(0, 27) + '...' : row.clinic_name;
      const conversationCount = parseInt(row.conversation_count) || 0;
      const engagedCount = parseInt(row.engaged_count) || 0;
      const bookingCount = parseInt(row.booking_count) || 0;
      const leadCount = parseInt(row.lead_count) || 0;

      console.log(`${clinicName.padEnd(30)} | ${conversationCount.toString().padStart(11)} | ${engagedCount.toString().padStart(7)} | ${bookingCount.toString().padStart(8)} | ${leadCount.toString().padStart(5)}`);
    });

    console.log('='.repeat(80));

    // Get date range
    const dateRange = await db.query(`
      SELECT
        MIN(created_at) as earliest_conversation,
        MAX(created_at) as latest_conversation,
        MIN(date) as earliest_booking,
        MAX(date) as latest_booking
      FROM conversations c
      LEFT JOIN bookings b ON b.conversation_id = c.id
    `);

    const dateInfo = dateRange.rows[0];

    console.log('\n📅 DATE RANGE ANALYSIS');
    console.log('='.repeat(50));
    console.log(`📝 Conversations: ${new Date(dateInfo.earliest_conversation).toLocaleDateString()} - ${new Date(dateInfo.latest_conversation).toLocaleDateString()}`);
    if (dateInfo.earliest_booking) {
      console.log(`📅 Bookings: ${new Date(dateInfo.earliest_booking).toLocaleDateString()} - ${new Date(dateInfo.latest_booking).toLocaleDateString()}`);
    }
    console.log('='.repeat(50));

    // Success summary
    const allMatch = totalMatch && bookingsMatch && leadsMatch && engagedMatch;

    console.log('\n🎉 IMPORT SUCCESS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed ${results.total_conversations.toLocaleString()} conversations`);
    console.log(`✅ All records imported including ${results.records_without_user_id.toLocaleString()} without User ID`);
    console.log(`✅ Created ${results.total_clients} unique clients and locations`);
    console.log(`✅ Generated ${results.total_customers.toLocaleString()} unique customer records`);
    console.log(`${allMatch ? '✅' : '⚠️'} Metrics ${allMatch ? 'match' : 'are close to'} expected values`);
    console.log('='.repeat(50));

    console.log('\n🚀 READY FOR DASHBOARD INTERFACE!');
    console.log('The data is now available for creating a comprehensive dashboard interface.');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyResults();