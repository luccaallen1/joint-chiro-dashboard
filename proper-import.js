const Airtable = require('airtable');
const { Pool } = require('pg');
const DataProcessor = require('./src/services/dataProcessor');
require('dotenv').config();

// Configure database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure Airtable
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
const tableId = process.env.AIRTABLE_TABLE_ID;

async function properImport() {
  console.log('🚀 PROPER IMPORT - WITH REAL BOOKING RECORDS');
  console.log('============================================');

  const dataProcessor = new DataProcessor();
  let totalProcessed = 0;
  let totalInserted = 0;
  let bookingsCreated = 0;

  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', dbTest.rows[0].current_time);

    console.log('\n📊 Starting to fetch and process records...');

    // Use eachPage to process records in batches
    await base(tableId).select({
      pageSize: 100,
      fields: [
        'User ID',
        'Name',
        'Clinic',
        'Automation',
        'Booking',
        'Conversation Transcript',
        'Created',
        'Lead Created',
        'Engaged in conversation',
        'Email',
        'Phone'
      ]
    }).eachPage(async (records, fetchNextPage) => {
      console.log(`\nProcessing batch of ${records.length} records...`);

      // Process each record in this batch
      for (const record of records) {
        const processedRecord = dataProcessor.processRecord(record);

        if (processedRecord) {
          try {
            // Create/get client for clinic
            let clientId;
            const clinicName = processedRecord.clinic || 'Unknown';

            const clientResult = await pool.query(`
              INSERT INTO clients (name, company, email)
              VALUES ($1, $2, $3)
              ON CONFLICT (email) DO UPDATE SET
                name = EXCLUDED.name,
                company = EXCLUDED.company
              RETURNING id
            `, [
              clinicName,
              clinicName + ' Clinic',
              clinicName.toLowerCase().replace(/\s+/g, '') + '@clinic.local'
            ]);
            clientId = clientResult.rows[0].id;

            // Create/get location
            let locationId;
            let locationResult = await pool.query(`
              SELECT id FROM locations WHERE client_id = $1 AND name = $2
            `, [clientId, clinicName]);

            if (locationResult.rows.length > 0) {
              locationId = locationResult.rows[0].id;
            } else {
              const newLocationResult = await pool.query(`
                INSERT INTO locations (client_id, name, address, city, state)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `, [
                clientId,
                clinicName,
                '123 Main St',
                'Unknown City',
                'Unknown State'
              ]);
              locationId = newLocationResult.rows[0].id;
            }

            // Get automation
            let automationId;
            const automationResult = await pool.query(`
              INSERT INTO automations (code, name)
              VALUES ($1, $2)
              ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
              RETURNING id
            `, [processedRecord.automation_code, processedRecord.automation_code]);
            automationId = automationResult.rows[0].id;

            // Create/get customer
            let customerId;
            let customerResult = await pool.query(`
              SELECT id FROM customers WHERE external_id = $1
            `, [processedRecord.external_id]);

            if (customerResult.rows.length > 0) {
              customerId = customerResult.rows[0].id;
            } else {
              const newCustomerResult = await pool.query(`
                INSERT INTO customers (
                  external_id,
                  name,
                  email,
                  phone,
                  first_seen,
                  last_activity
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
              `, [
                processedRecord.external_id,
                processedRecord.name || 'Unknown Customer',
                processedRecord.email || null,
                processedRecord.phone || null,
                processedRecord.created_at || new Date().toISOString(),
                processedRecord.created_at || new Date().toISOString()
              ]);
              customerId = newCustomerResult.rows[0].id;
            }

            // Insert conversation
            const conversationResult = await pool.query(`
              INSERT INTO conversations (
                external_id,
                client_id,
                location_id,
                automation_id,
                customer_id,
                transcript,
                engaged,
                lead_created,
                created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (external_id) DO UPDATE SET
                transcript = EXCLUDED.transcript,
                engaged = EXCLUDED.engaged,
                lead_created = EXCLUDED.lead_created
              RETURNING id
            `, [
              processedRecord.external_id,
              clientId,
              locationId,
              automationId,
              customerId,
              processedRecord.conversation_transcript,
              processedRecord.engaged,
              processedRecord.lead_created,
              processedRecord.created_at || new Date().toISOString()
            ]);

            const conversationId = conversationResult.rows[0].id;

            // **NEW: Create actual booking record if booking exists**
            if (processedRecord.booking_exists && processedRecord.booking_date) {
              await pool.query(`
                INSERT INTO bookings (
                  client_id,
                  location_id,
                  automation_id,
                  customer_id,
                  conversation_id,
                  date,
                  status,
                  revenue,
                  created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                clientId,
                locationId,
                automationId,
                customerId,
                conversationId,
                processedRecord.booking_date,
                'completed',
                29.00, // Default booking fee
                new Date().toISOString()
              ]);
              bookingsCreated++;
            }

            totalInserted++;
          } catch (insertError) {
            console.error('Insert error for record', record.id, ':', insertError.message);
          }
        }

        totalProcessed++;
      }

      console.log(`✓ Batch complete. Processed: ${totalProcessed}, Inserted: ${totalInserted}, Bookings: ${bookingsCreated}`);

      fetchNextPage();
    });

    // Final validation
    console.log('\n🎉 PROPER IMPORT COMPLETE!');
    console.log('==========================');
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Total inserted: ${totalInserted}`);
    console.log(`Bookings created: ${bookingsCreated}`);

    const finalStats = dataProcessor.getStats();
    console.log('\n📊 FINAL STATISTICS:');
    console.log(`- Records processed: ${finalStats.totalProcessed}`);
    console.log(`- Bookings found: ${finalStats.bookingsFound}`);
    console.log(`- Leads created: ${finalStats.leadsCreated}`);
    console.log(`- Engaged conversations: ${finalStats.engagedConversations}`);

    // Check database counts
    const dbCounts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as total_conversations,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM conversations WHERE engaged = true) as engaged_conversations,
        (SELECT COUNT(*) FROM conversations WHERE lead_created = true) as leads_created
    `);

    console.log('\n🗄️  DATABASE VERIFICATION:');
    console.log(`- Total conversations in DB: ${dbCounts.rows[0].total_conversations}`);
    console.log(`- Total bookings in DB: ${dbCounts.rows[0].total_bookings}`);
    console.log(`- Engaged conversations in DB: ${dbCounts.rows[0].engaged_conversations}`);
    console.log(`- Leads created in DB: ${dbCounts.rows[0].leads_created}`);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

properImport();