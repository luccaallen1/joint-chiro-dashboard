#!/usr/bin/env node

const BatchProcessor = require('./services/batchProcessor');
require('dotenv').config();

async function runImport() {
  console.log('🚀 JointChiro Data Import Tool');
  console.log('================================');
  console.log('');

  try {
    // Check environment variables
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY environment variable is required');
    }
    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID environment variable is required');
    }
    if (!process.env.AIRTABLE_TABLE_ID) {
      throw new Error('AIRTABLE_TABLE_ID environment variable is required');
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('✅ Environment variables validated');
    console.log(`📋 Base ID: ${process.env.AIRTABLE_BASE_ID}`);
    console.log(`📋 Table ID: ${process.env.AIRTABLE_TABLE_ID}`);
    console.log('');

    // Show expected metrics
    console.log('🎯 EXPECTED METRICS:');
    console.log('  • Total records: 20,077');
    console.log('  • Bookings (contains "2025"): 3,122');
    console.log('  • Leads ("Lead Created" = "Yes"): 13,908');
    console.log('  • Engaged ("Engaged in conversation" = TRUE/True/true): 7,910');
    console.log('');

    // Ask for confirmation
    const shouldProceed = await askForConfirmation();
    if (!shouldProceed) {
      console.log('Import cancelled by user.');
      process.exit(0);
    }

    const batchProcessor = new BatchProcessor();
    const startTime = Date.now();

    console.log('Starting import process...');
    console.log('');

    const result = await batchProcessor.processAllRecords();

    if (result.success) {
      console.log('');
      console.log('🎉 IMPORT COMPLETED SUCCESSFULLY!');
      console.log('================================');
      console.log(`⏱️  Total time: ${result.processingTime}s`);
      console.log(`📊 Records processed: ${result.totalProcessed}`);
      console.log('');

      // Show validation results
      const validation = result.validation;
      console.log('📋 VALIDATION RESULTS:');
      console.log(`Bookings: ${validation.bookings.actual}/${validation.bookings.expected} ${validation.bookings.match ? '✅' : '❌'}`);
      console.log(`Leads: ${validation.leads.actual}/${validation.leads.expected} ${validation.leads.match ? '✅' : '❌'}`);
      console.log(`Engaged: ${validation.engaged.actual}/${validation.engaged.expected} ${validation.engaged.match ? '✅' : '❌'}`);

      // Check if all validations passed
      const allValid = validation.bookings.match && validation.leads.match && validation.engaged.match;
      console.log('');
      console.log(`🏆 Overall validation: ${allValid ? '✅ ALL METRICS MATCH!' : '❌ Some metrics do not match expected values'}`);

      if (!allValid) {
        console.log('');
        console.log('⚠️  Please review the data processing rules in dataProcessor.js');
        console.log('   and verify the Airtable data format matches expectations.');
        process.exit(1);
      }

    } else {
      console.log('❌ Import failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ Import failed with error:', error.message);
    console.error('');

    if (error.message.includes('environment variable')) {
      console.error('💡 Make sure to copy .env.example to .env and set the correct values:');
      console.error('   cp .env.example .env');
      console.error('   # Then edit .env with your actual API keys');
    } else if (error.message.includes('connection')) {
      console.error('💡 Connection issues:');
      console.error('   - Check your internet connection');
      console.error('   - Verify Airtable API key and base/table IDs');
      console.error('   - Make sure PostgreSQL is running (npm run docker:up)');
      console.error('   - Run migrations if needed (npm run migrate)');
    }

    process.exit(1);
  }
}

/**
 * Ask user for confirmation before proceeding with import
 */
function askForConfirmation() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  This will import all data from Airtable to the local database.');
    console.log('   Existing data may be affected.');
    console.log('');

    rl.question('Do you want to proceed? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Handle script termination
 */
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Import cancelled by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('🛑 Import terminated');
  process.exit(0);
});

// Run the import if this script is executed directly
if (require.main === module) {
  runImport();
}

module.exports = { runImport };