const db = require('../db/connection');
const AirtableService = require('./airtable.service');
const DataProcessor = require('./dataProcessor');

class BatchProcessor {
  constructor() {
    this.airtableService = new AirtableService();
    this.dataProcessor = new DataProcessor();
    this.batchSize = 100;
    this.totalExpected = 20077; // Expected total records
  }

  /**
   * Process all records from Airtable with batch processing and progress logging
   */
  async processAllRecords() {
    try {
      console.log('🚀 Starting batch processing of Airtable data...');
      console.log(`Expected total records: ${this.totalExpected}`);

      // Test connections first
      const airtableConnected = await this.airtableService.testConnection();
      const dbConnected = await db.testConnection();

      if (!airtableConnected) {
        throw new Error('Could not connect to Airtable');
      }
      if (!dbConnected) {
        throw new Error('Could not connect to database');
      }

      // Reset statistics
      this.dataProcessor.resetStats();

      // Clear existing data (optional - uncomment if needed)
      // await this.clearExistingData();

      // Process records in batches
      let processedCount = 0;
      let batchNumber = 1;
      const startTime = Date.now();

      console.log('\n📊 Starting data processing...');

      // Use the generator to process batches
      for await (const batch of this.airtableService.fetchAllRecords()) {
        const { records, processedCount: fetchedCount } = batch;

        console.log(`\n📦 Processing batch ${batchNumber} (${records.length} records)`);
        console.log(`   Progress: ${fetchedCount} of ${this.totalExpected} records fetched (${((fetchedCount / this.totalExpected) * 100).toFixed(1)}%)`);

        // Process this batch
        const processedBatch = await this.processBatch(records, batchNumber);
        processedCount += processedBatch.length;

        // Log progress
        const elapsedMs = Date.now() - startTime;
        const recordsPerSecond = (processedCount / (elapsedMs / 1000)).toFixed(1);

        console.log(`   ✓ Batch ${batchNumber} processed: ${processedBatch.length} records`);
        console.log(`   📊 Total processed: ${processedCount} | Rate: ${recordsPerSecond} records/sec`);

        // Show current statistics
        const currentStats = this.dataProcessor.getStats();
        console.log(`   📈 Running totals - Bookings: ${currentStats.bookingsFound} | Leads: ${currentStats.leadsCreated} | Engaged: ${currentStats.engagedConversations}`);

        batchNumber++;

        // Small delay to avoid overwhelming the system
        await this.delay(100);
      }

      // Final validation and results
      const finalStats = this.dataProcessor.getStats();
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log('\n🎉 PROCESSING COMPLETE!');
      console.log('='.repeat(50));
      console.log(`Total processing time: ${totalTime} seconds`);
      console.log(`Total records processed: ${finalStats.totalProcessed}`);
      console.log(`Invalid records skipped: ${finalStats.invalidRecords}`);
      console.log(`Average processing rate: ${(finalStats.totalProcessed / totalTime).toFixed(1)} records/sec`);
      console.log('='.repeat(50));

      // Validate metrics against expected values
      const validationResults = this.dataProcessor.validateMetrics();

      // Show detailed statistics
      this.logFinalStatistics(finalStats);

      return {
        success: true,
        totalProcessed: finalStats.totalProcessed,
        stats: finalStats,
        validation: validationResults,
        processingTime: totalTime
      };

    } catch (error) {
      console.error('❌ Batch processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Process a single batch of records
   */
  async processBatch(records, batchNumber) {
    const processedRecords = [];
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      for (const record of records) {
        const processedRecord = this.dataProcessor.processRecord(record);

        if (processedRecord) {
          // Insert into database
          await this.insertRecord(client, processedRecord);
          processedRecords.push(processedRecord);
        }
      }

      await client.query('COMMIT');
      return processedRecords;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error processing batch ${batchNumber}:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert a processed record into the database
   */
  async insertRecord(client, record) {
    try {
      // First, ensure we have a client for this clinic
      let clientId = await this.getOrCreateClient(client, record.clinic);

      // Create a customer record
      const customerResult = await client.query(`
        INSERT INTO customers (external_id, name, email, phone, first_seen, last_activity)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (external_id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          last_activity = EXCLUDED.last_activity
        RETURNING id
      `, [
        record.external_id,
        record.name,
        record.email,
        record.phone,
        record.created_at,
        record.created_at
      ]);

      const customerId = customerResult.rows[0].id;

      // Get or create location (currently 1:1 with client)
      const locationId = await this.getOrCreateLocation(client, clientId, record.clinic);

      // Get automation ID
      const automationId = await this.getAutomationId(client, record.automation_code);

      // Create conversation record
      const conversationResult = await client.query(`
        INSERT INTO conversations (
          external_id, client_id, location_id, automation_id, customer_id,
          transcript, engaged, lead_created, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        record.airtable_id,
        clientId,
        locationId,
        automationId,
        customerId,
        record.conversation_transcript,
        record.engaged,
        record.lead_created,
        record.created_at
      ]);

      const conversationId = conversationResult.rows[0].id;

      // Create booking if exists
      if (record.booking_exists && record.booking_date) {
        await client.query(`
          INSERT INTO bookings (
            client_id, location_id, automation_id, customer_id, conversation_id,
            date, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          clientId,
          locationId,
          automationId,
          customerId,
          conversationId,
          record.booking_date,
          'scheduled',
          record.created_at
        ]);
      }

      // Create lead if created
      if (record.lead_created) {
        await client.query(`
          INSERT INTO leads (
            client_id, location_id, automation_id, customer_id, conversation_id,
            source, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          clientId,
          locationId,
          automationId,
          customerId,
          conversationId,
          'chatbot',
          'new',
          record.created_at
        ]);
      }

    } catch (error) {
      console.error('Error inserting record:', error.message);
      throw error;
    }
  }

  /**
   * Get or create client
   */
  async getOrCreateClient(client, clinicName) {
    if (!clinicName) {
      clinicName = 'Unknown Clinic';
    }

    const result = await client.query(`
      INSERT INTO clients (name, company, email, status)
      VALUES ($1, $2, $3, 'active')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [clinicName, clinicName, `${clinicName.toLowerCase().replace(/\s+/g, '')}@clinic.com`]);

    return result.rows[0].id;
  }

  /**
   * Get or create location
   */
  async getOrCreateLocation(client, clientId, clinicName) {
    if (!clinicName) {
      clinicName = 'Unknown Location';
    }

    const result = await client.query(`
      INSERT INTO locations (client_id, name, address, city, state, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [clientId, clinicName, '123 Main St', 'Unknown', 'Unknown']);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    } else {
      // Location already exists, get it
      const existingResult = await client.query(
        'SELECT id FROM locations WHERE client_id = $1 LIMIT 1',
        [clientId]
      );
      return existingResult.rows[0].id;
    }
  }

  /**
   * Get automation ID by code
   */
  async getAutomationId(client, automationCode) {
    const result = await client.query(
      'SELECT id FROM automations WHERE code = $1',
      [automationCode]
    );

    if (result.rows.length === 0) {
      throw new Error(`Unknown automation code: ${automationCode}`);
    }

    return result.rows[0].id;
  }

  /**
   * Clear existing data (optional)
   */
  async clearExistingData() {
    console.log('🗑️  Clearing existing data...');

    await db.query('TRUNCATE bookings, leads, conversations, location_automations, customers, locations, clients RESTART IDENTITY CASCADE');

    console.log('✓ Existing data cleared');
  }

  /**
   * Helper method to add delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log final statistics
   */
  logFinalStatistics(stats) {
    console.log('\n📊 FINAL STATISTICS');
    console.log('='.repeat(50));
    console.log(`Total Records: ${stats.totalProcessed}`);
    console.log(`Invalid Records: ${stats.invalidRecords}`);
    console.log('');
    console.log('📈 METRICS BREAKDOWN:');
    console.log(`Bookings Found: ${stats.bookingsFound} (${stats.bookingRate})`);
    console.log(`Leads Created: ${stats.leadsCreated} (${stats.leadRate})`);
    console.log(`Engaged Conversations: ${stats.engagedConversations} (${stats.engagementRate})`);
    console.log('');
    console.log('🤖 AUTOMATION BREAKDOWN:');

    Object.entries(stats.automationMapping).forEach(([code, count]) => {
      const percentage = ((count / stats.totalProcessed) * 100).toFixed(1);
      console.log(`${code}: ${count} (${percentage}%)`);
    });

    console.log('='.repeat(50));
  }
}

module.exports = BatchProcessor;