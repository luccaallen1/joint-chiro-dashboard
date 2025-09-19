const AirtableService = require('./src/services/airtable.service');
const DataProcessor = require('./src/services/dataProcessor');
require('dotenv').config();

async function debugFirstRecord() {
  try {
    console.log('🔍 Debugging first Airtable record...');

    const airtableService = new AirtableService();
    const dataProcessor = new DataProcessor();

    // Get just the first record
    let firstRecord = null;
    let totalFetched = 0;

    for await (const batch of airtableService.fetchAllRecords()) {
      const { records } = batch;
      totalFetched += records.length;
      console.log(`Fetched ${totalFetched} total records, batch has ${records.length} records`);

      if (records.length > 0) {
        firstRecord = records[0];
        console.log(`Got first record: ${firstRecord.id}`);
        break;
      }
    }

    if (!firstRecord) {
      console.error('No records found!');
      return;
    }

    console.log('📋 First record from Airtable:');
    console.log('Record ID:', firstRecord.id);
    console.log('Fields:');

    // Log all fields
    for (const [key, value] of Object.entries(firstRecord.fields)) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }

    console.log('\n🔄 Processing record...');
    const processedRecord = dataProcessor.processRecord(firstRecord);

    if (processedRecord) {
      console.log('✅ Processed record:');
      console.log(JSON.stringify(processedRecord, null, 2));
    } else {
      console.log('❌ Record processing failed');
    }

    console.log('\n📊 Current stats:');
    console.log(dataProcessor.getStats());

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

debugFirstRecord();