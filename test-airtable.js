const AirtableService = require('./src/services/airtable.service');

async function testAirtable() {
  try {
    console.log('Testing Airtable connection...');

    const airtableService = new AirtableService();

    // Test connection
    const connected = await airtableService.testConnection();

    if (connected) {
      console.log('✅ Airtable connection successful!');

      // Get sample records
      console.log('Fetching sample records...');
      const sampleRecords = await airtableService.getSampleRecords(5);

      console.log(`Found ${sampleRecords.length} sample records`);

      sampleRecords.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log('  ID:', record.id);
        console.log('  Fields:', Object.keys(record.fields));
        console.log('  User ID:', record.fields['User ID'] || 'MISSING');
        console.log('  Clinic:', record.fields['Clinic'] || 'MISSING');
        console.log('  Booking:', record.fields['Booking'] || 'MISSING');
        console.log('  Lead Created:', record.fields['Lead Created'] || 'MISSING');
        console.log('  Engaged:', record.fields['Engaged in conversation'] || 'MISSING');
      });

      // Get total count
      console.log('\nGetting total record count...');
      const totalCount = await airtableService.getRecordCount();
      console.log(`Total records in Airtable: ${totalCount}`);

    } else {
      console.log('❌ Airtable connection failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testAirtable();