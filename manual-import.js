const db = require('./src/db/connection');
const AirtableService = require('./src/services/airtable.service');
const DataProcessor = require('./src/services/dataProcessor');
const logger = require('./src/utils/logger');

async function manualImport() {
  console.log('🚀 Starting Manual Import from Airtable...');

  try {
    const airtableService = new AirtableService();
    const dataProcessor = new DataProcessor();

    // Test connections
    console.log('Testing connections...');
    const dbConnected = await db.testConnection();
    const airtableConnected = await airtableService.testConnection();

    if (!dbConnected) throw new Error('Database connection failed');
    if (!airtableConnected) throw new Error('Airtable connection failed');

    console.log('✅ Both connections successful');

    // Reset processor stats
    dataProcessor.resetStats();

    // Fetch all records using the working method
    console.log('Fetching all records from Airtable...');
    let allRecords = [];
    let processedCount = 0;

    const selectOptions = {
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
    };

    const query = airtableService.base(airtableService.tableId).select(selectOptions);

    await query.eachPage((records, fetchNextPage) => {
      allRecords.push(...records);
      processedCount += records.length;
      console.log(`Fetched ${processedCount} records so far...`);
      fetchNextPage();
    });

    console.log(`✅ Fetched ${allRecords.length} total records from Airtable`);

    // Process all records in batches
    const batchSize = 100;
    let totalProcessed = 0;
    let conversationsCreated = 0;
    let bookingsCreated = 0;
    let leadsCreated = 0;
    let engagedConversations = 0;
    let clientsCreated = 0;
    let locationsCreated = 0;
    let customersCreated = 0;
    let customersUpdated = 0;
    let recordsWithMissingUserId = 0;

    const startTime = Date.now();

    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`\n📦 Processing batch ${batchNumber}/${Math.ceil(allRecords.length / batchSize)} (${batch.length} records)`);

      const client = await db.getClient();

      try {
        await client.query('BEGIN');

        for (const airtableRecord of batch) {
          const processedRecord = dataProcessor.processRecord(airtableRecord);

          if (!processedRecord) {
            console.warn(`Skipping invalid record: ${airtableRecord.id}`);
            continue;
          }

          // Track missing user IDs
          if (!processedRecord.external_id) {
            recordsWithMissingUserId++;
          }

          // Process the record (simplified version)
          const result = await processRecord(client, processedRecord, airtableRecord.id);

          totalProcessed++;
          if (result.conversationCreated) conversationsCreated++;
          if (result.bookingCreated) bookingsCreated++;
          if (result.leadCreated) leadsCreated++;
          if (result.engaged) engagedConversations++;
          if (result.clientCreated) clientsCreated++;
          if (result.locationCreated) locationsCreated++;
          if (result.customerCreated) customersCreated++;
          if (result.customerUpdated) customersUpdated++;
        }

        await client.query('COMMIT');
        console.log(`✅ Batch ${batchNumber} completed`);

      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }

    // Final results
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    const recordsPerSecond = (totalProcessed / durationSeconds).toFixed(1);

    console.log('\n🎉 IMPORT COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`⏱️  Total time: ${durationSeconds}s`);
    console.log(`📊 Records processed: ${totalProcessed}`);
    console.log(`🚀 Processing rate: ${recordsPerSecond} records/sec`);
    console.log('');
    console.log('📈 RESULTS:');
    console.log(`   Conversations: ${conversationsCreated}`);
    console.log(`   Bookings: ${bookingsCreated}`);
    console.log(`   Leads: ${leadsCreated}`);
    console.log(`   Engaged: ${engagedConversations}`);
    console.log(`   Clients: ${clientsCreated}`);
    console.log(`   Locations: ${locationsCreated}`);
    console.log(`   Customers: ${customersCreated}`);
    console.log(`   Records without User ID: ${recordsWithMissingUserId}`);
    console.log('');

    // Calculate rates
    const bookingRate = conversationsCreated > 0 ? ((bookingsCreated / conversationsCreated) * 100).toFixed(1) : '0.0';
    const leadRate = conversationsCreated > 0 ? ((leadsCreated / conversationsCreated) * 100).toFixed(1) : '0.0';
    const engagementRate = conversationsCreated > 0 ? ((engagedConversations / conversationsCreated) * 100).toFixed(1) : '0.0';

    console.log('📊 RATES:');
    console.log(`   Booking Rate: ${bookingRate}%`);
    console.log(`   Lead Rate: ${leadRate}%`);
    console.log(`   Engagement Rate: ${engagementRate}%`);
    console.log('');

    // Validate against expected metrics
    const expectedBookings = 3122;
    const expectedLeads = 13908;
    const expectedEngaged = 7910;
    const expectedTotal = 20077;

    console.log('🎯 VALIDATION:');
    console.log(`   Total: ${totalProcessed}/${expectedTotal} ${totalProcessed === expectedTotal ? '✅' : '❌'}`);
    console.log(`   Bookings: ${bookingsCreated}/${expectedBookings} ${bookingsCreated === expectedBookings ? '✅' : '❌'}`);
    console.log(`   Leads: ${leadsCreated}/${expectedLeads} ${leadsCreated === expectedLeads ? '✅' : '❌'}`);
    console.log(`   Engaged: ${engagedConversations}/${expectedEngaged} ${engagedConversations === expectedEngaged ? '✅' : '❌'}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

async function processRecord(client, processedRecord, airtableId) {
  const result = {
    conversationCreated: false,
    bookingCreated: false,
    leadCreated: false,
    engaged: processedRecord.engaged,
    clientCreated: false,
    locationCreated: false,
    customerCreated: false,
    customerUpdated: false
  };

  try {
    // 1. Get or create client
    const { clientId, created: clientCreated } = await getOrCreateClient(client, processedRecord.clinic);
    result.clientCreated = clientCreated;

    // 2. Get or create location
    const { locationId, created: locationCreated } = await getOrCreateLocation(client, clientId, processedRecord.clinic);
    result.locationCreated = locationCreated;

    // 3. Get or create customer (handling missing User ID)
    let externalId = processedRecord.external_id;
    if (!externalId) {
      externalId = `no-user-id-${airtableId}`;
    }

    const { customerId, created: customerCreated, updated: customerUpdated } = await getOrCreateCustomer(
      client, externalId, processedRecord
    );
    result.customerCreated = customerCreated;
    result.customerUpdated = customerUpdated;

    // 4. Get automation ID
    const automationId = await getAutomationId(client, processedRecord.automation_code);

    // 5. Create conversation
    const { conversationId, created: conversationCreated } = await createOrUpdateConversation(client, {
      external_id: airtableId,
      client_id: clientId,
      location_id: locationId,
      automation_id: automationId,
      customer_id: customerId,
      transcript: processedRecord.conversation_transcript,
      engaged: processedRecord.engaged,
      lead_created: processedRecord.lead_created,
      created_at: processedRecord.created_at
    });
    result.conversationCreated = conversationCreated;

    // 6. Create booking if exists
    if (processedRecord.booking_exists) {
      const bookingCreated = await createBookingIfNotExists(client, {
        client_id: clientId,
        location_id: locationId,
        automation_id: automationId,
        customer_id: customerId,
        conversation_id: conversationId,
        date: processedRecord.booking_date || processedRecord.created_at, // Use created_at as fallback
        created_at: processedRecord.created_at
      });
      result.bookingCreated = bookingCreated;
    }

    // 7. Create lead if created
    if (processedRecord.lead_created) {
      const leadCreated = await createLeadIfNotExists(client, {
        client_id: clientId,
        location_id: locationId,
        automation_id: automationId,
        customer_id: customerId,
        conversation_id: conversationId,
        created_at: processedRecord.created_at
      });
      result.leadCreated = leadCreated;
    }

    return result;

  } catch (error) {
    console.error('Error processing record:', airtableId, error.message);
    throw error;
  }
}

// Helper functions (simplified versions)
async function getOrCreateClient(client, clinicName) {
  if (!clinicName) clinicName = 'Unknown Clinic';

  const email = `${clinicName.toLowerCase().replace(/[^a-z0-9]/g, '')}@clinic.com`;

  const existingResult = await client.query('SELECT id FROM clients WHERE email = $1', [email]);
  if (existingResult.rows.length > 0) {
    return { clientId: existingResult.rows[0].id, created: false };
  }

  const result = await client.query(`
    INSERT INTO clients (name, company, email, status)
    VALUES ($1, $2, $3, 'active')
    RETURNING id
  `, [clinicName, clinicName, email]);

  return { clientId: result.rows[0].id, created: true };
}

async function getOrCreateLocation(client, clientId, clinicName) {
  if (!clinicName) clinicName = 'Unknown Location';

  const existingResult = await client.query('SELECT id FROM locations WHERE client_id = $1', [clientId]);
  if (existingResult.rows.length > 0) {
    return { locationId: existingResult.rows[0].id, created: false };
  }

  const result = await client.query(`
    INSERT INTO locations (client_id, name, address, city, state, status)
    VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING id
  `, [clientId, clinicName, '123 Main St', 'Unknown', 'Unknown']);

  return { locationId: result.rows[0].id, created: true };
}

async function getOrCreateCustomer(client, externalId, processedRecord) {
  const existingResult = await client.query('SELECT id FROM customers WHERE external_id = $1', [externalId]);

  if (existingResult.rows.length > 0) {
    await client.query(`
      UPDATE customers SET
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        last_activity = $5
      WHERE external_id = $1
    `, [externalId, processedRecord.name, processedRecord.email, processedRecord.phone, processedRecord.created_at]);

    return { customerId: existingResult.rows[0].id, created: false, updated: true };
  }

  const result = await client.query(`
    INSERT INTO customers (external_id, name, email, phone, first_seen, last_activity)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [externalId, processedRecord.name, processedRecord.email, processedRecord.phone, processedRecord.created_at, processedRecord.created_at]);

  return { customerId: result.rows[0].id, created: true, updated: false };
}

async function getAutomationId(client, automationCode) {
  let result = await client.query('SELECT id FROM automations WHERE code = $1', [automationCode]);

  if (result.rows.length === 0) {
    // Create the automation code if it doesn't exist
    console.log(`Creating new automation code: ${automationCode}`);
    const insertResult = await client.query(`
      INSERT INTO automations (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [automationCode, `${automationCode} Automation`, `${automationCode} automation type`]);

    return insertResult.rows[0].id;
  }

  return result.rows[0].id;
}

async function createOrUpdateConversation(client, conversationData) {
  const existingResult = await client.query('SELECT id FROM conversations WHERE external_id = $1', [conversationData.external_id]);

  if (existingResult.rows.length > 0) {
    return { conversationId: existingResult.rows[0].id, created: false };
  }

  const result = await client.query(`
    INSERT INTO conversations (
      external_id, client_id, location_id, automation_id, customer_id,
      transcript, engaged, lead_created, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    conversationData.external_id,
    conversationData.client_id,
    conversationData.location_id,
    conversationData.automation_id,
    conversationData.customer_id,
    conversationData.transcript,
    conversationData.engaged,
    conversationData.lead_created,
    conversationData.created_at
  ]);

  return { conversationId: result.rows[0].id, created: true };
}

async function createBookingIfNotExists(client, bookingData) {
  const existingResult = await client.query('SELECT id FROM bookings WHERE conversation_id = $1', [bookingData.conversation_id]);

  if (existingResult.rows.length > 0) return false;

  await client.query(`
    INSERT INTO bookings (
      client_id, location_id, automation_id, customer_id, conversation_id,
      date, status, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    bookingData.client_id,
    bookingData.location_id,
    bookingData.automation_id,
    bookingData.customer_id,
    bookingData.conversation_id,
    bookingData.date,
    'scheduled',
    bookingData.created_at
  ]);

  return true;
}

async function createLeadIfNotExists(client, leadData) {
  const existingResult = await client.query('SELECT id FROM leads WHERE conversation_id = $1', [leadData.conversation_id]);

  if (existingResult.rows.length > 0) return false;

  await client.query(`
    INSERT INTO leads (
      client_id, location_id, automation_id, customer_id, conversation_id,
      source, status, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    leadData.client_id,
    leadData.location_id,
    leadData.automation_id,
    leadData.customer_id,
    leadData.conversation_id,
    'chatbot',
    'new',
    leadData.created_at
  ]);

  return true;
}

// Run the import
if (require.main === module) {
  manualImport()
    .then(() => {
      console.log('Import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = { manualImport };