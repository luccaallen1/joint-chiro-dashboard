const AirtableService = require('./src/services/airtable.service');
const DataProcessor = require('./src/services/dataProcessor');

async function validateAirtableData() {
  console.log('🔍 Validating Airtable Data Processing...');

  const airtableService = new AirtableService();
  const dataProcessor = new DataProcessor();

  // Test connection
  const connected = await airtableService.testConnection();
  if (!connected) {
    console.error('❌ Airtable connection failed');
    return;
  }

  console.log('✅ Connected to Airtable');

  // Fetch all records
  let allRecords = [];
  let totalFetched = 0;

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
    totalFetched += records.length;
    console.log(`Fetched ${totalFetched} records...`);
    fetchNextPage();
  });

  console.log(`\n📊 Total records fetched: ${allRecords.length}`);

  // Raw counts from Airtable
  let rawBookingsWith2025 = 0;
  let rawLeadsWithYes = 0;
  let rawEngagedWithTrue = 0;
  let bookingsWithValidDate = 0;
  let bookingsWithInvalidDate = 0;

  // Process through our DataProcessor
  dataProcessor.resetStats();
  let processedCount = 0;
  let validProcessed = 0;

  console.log('\n🔍 Analyzing each record...');

  for (const record of allRecords) {
    const fields = record.fields;

    // Raw Airtable checks (what you manually verified)
    if (fields['Booking'] && String(fields['Booking']).includes('2025')) {
      rawBookingsWith2025++;

      // Check if the booking date is parseable
      try {
        const dataProcessorInstance = new DataProcessor();
        const bookingDate = dataProcessorInstance.parseBookingDate(fields['Booking']);
        if (bookingDate) {
          bookingsWithValidDate++;
        } else {
          bookingsWithInvalidDate++;
          console.log(`❌ Unparseable booking date in record ${record.id}: "${fields['Booking']}"`);
        }
      } catch (error) {
        bookingsWithInvalidDate++;
        console.log(`❌ Error parsing booking date in record ${record.id}: "${fields['Booking']}" - ${error.message}`);
      }
    }

    if (fields['Lead Created'] && String(fields['Lead Created']).trim() === 'Yes') {
      rawLeadsWithYes++;
    }

    if (fields['Engaged in conversation']) {
      const engagedStr = String(fields['Engaged in conversation']).trim();
      if (engagedStr === 'TRUE' || engagedStr === 'True' || engagedStr === 'true') {
        rawEngagedWithTrue++;
      }
    }

    // Process through DataProcessor
    const processedRecord = dataProcessor.processRecord(record);
    processedCount++;

    if (processedRecord) {
      validProcessed++;
    }
  }

  console.log('\n📈 VALIDATION RESULTS:');
  console.log('='.repeat(50));

  console.log('\n🎯 RAW AIRTABLE COUNTS (your manual verification):');
  console.log(`  Bookings with "2025": ${rawBookingsWith2025}`);
  console.log(`  Leads with "Yes": ${rawLeadsWithYes}`);
  console.log(`  Engaged with "True": ${rawEngagedWithTrue}`);

  console.log('\n📝 BOOKING DATE ANALYSIS:');
  console.log(`  Bookings with valid dates: ${bookingsWithValidDate}`);
  console.log(`  Bookings with invalid dates: ${bookingsWithInvalidDate}`);
  console.log(`  Total bookings: ${rawBookingsWith2025}`);

  console.log('\n🔧 DATAPROCESSOR RESULTS:');
  const stats = dataProcessor.getStats();
  console.log(`  Processed records: ${processedCount}`);
  console.log(`  Valid records: ${validProcessed}`);
  console.log(`  Invalid records: ${stats.invalidRecords}`);
  console.log(`  Bookings found: ${stats.bookingsFound}`);
  console.log(`  Leads created: ${stats.leadsCreated}`);
  console.log(`  Engaged conversations: ${stats.engagedConversations}`);

  console.log('\n❓ DISCREPANCIES:');
  console.log(`  Booking difference: ${rawBookingsWith2025 - stats.bookingsFound} (${rawBookingsWith2025} raw vs ${stats.bookingsFound} processed)`);
  console.log(`  Lead difference: ${rawLeadsWithYes - stats.leadsCreated} (${rawLeadsWithYes} raw vs ${stats.leadsCreated} processed)`);
  console.log(`  Engaged difference: ${rawEngagedWithTrue - stats.engagedConversations} (${rawEngagedWithTrue} raw vs ${stats.engagedConversations} processed)`);

  console.log('\n🎯 EXPECTED vs ACTUAL:');
  console.log(`  Expected bookings: 3,054 | Actual raw: ${rawBookingsWith2025} | Processed: ${stats.bookingsFound}`);
  console.log(`  Expected leads: 13,910 | Actual raw: ${rawLeadsWithYes} | Processed: ${stats.leadsCreated}`);
  console.log(`  Expected engaged: 7,912 | Actual raw: ${rawEngagedWithTrue} | Processed: ${stats.engagedConversations}`);

  console.log('='.repeat(50));
}

if (require.main === module) {
  validateAirtableData()
    .then(() => {
      console.log('\n✅ Validation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateAirtableData };