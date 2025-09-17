const db = require('../db/connection');
const AirtableService = require('./airtable.service');
const DataProcessor = require('./dataProcessor');
const logger = require('../utils/logger');

class ImportService {
  constructor() {
    this.airtableService = new AirtableService();
    this.dataProcessor = new DataProcessor();
    this.currentImportId = null;
    this.isRunning = false;
  }

  /**
   * Main import method - idempotent and can be run multiple times safely
   */
  async runImport(options = {}) {
    if (this.isRunning) {
      throw new Error('Import is already running');
    }

    const {
      triggeredBy = 'manual',
      incremental = false,
      notes = null
    } = options;

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Create import log entry
      this.currentImportId = await this.createImportLog({
        triggeredBy,
        incremental,
        notes
      });

      logger.info(`Starting import ${this.currentImportId}`, {
        triggeredBy,
        incremental,
        notes
      });

      // Test connections
      await this.validateConnections();

      // Get last import timestamp for incremental imports
      let lastModifiedFilter = null;
      if (incremental) {
        lastModifiedFilter = await this.getLastSuccessfulImportTimestamp();
        logger.info(`Incremental import since: ${lastModifiedFilter}`);
      }

      // Reset processor stats
      this.dataProcessor.resetStats();

      // Ensure all automation types exist and are linked to locations
      await this.ensureAutomationSetup();

      // Process all records
      const result = await this.processAllRecords(lastModifiedFilter);

      // Calculate final metrics
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      const recordsPerSecond = result.totalProcessed / durationSeconds;

      // Update import log with success
      await this.completeImportLog(this.currentImportId, {
        status: 'completed',
        ...result,
        duration_seconds: durationSeconds,
        records_per_second: recordsPerSecond
      });

      // Validate expected metrics (only for full imports)
      if (!incremental) {
        const validation = this.dataProcessor.validateMetrics();
        this.logValidationResults(validation);
      }

      logger.info(`Import ${this.currentImportId} completed successfully`, {
        durationSeconds,
        recordsPerSecond,
        totalProcessed: result.totalProcessed
      });

      return {
        success: true,
        importId: this.currentImportId,
        ...result,
        durationSeconds,
        recordsPerSecond
      };

    } catch (error) {
      logger.error(`Import ${this.currentImportId} failed:`, error);

      if (this.currentImportId) {
        await this.failImportLog(this.currentImportId, error.message);
      }

      throw error;
    } finally {
      this.isRunning = false;
      this.currentImportId = null;
    }
  }

  /**
   * Process all records from Airtable with idempotent operations
   */
  async processAllRecords(lastModifiedFilter = null) {
    let totalFetched = 0;
    let totalProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    let conversationsCreated = 0;
    let bookingsCreated = 0;
    let leadsCreated = 0;
    let engagedConversations = 0;

    let clientsCreated = 0;
    let locationsCreated = 0;
    let customersCreated = 0;
    let customersUpdated = 0;

    let batchNumber = 1;

    // Use generator to process in batches
    for await (const batch of this.airtableService.fetchAllRecords(lastModifiedFilter)) {
      const { records } = batch;
      totalFetched += records.length;

      logger.info(`Processing batch ${batchNumber}`, {
        batchSize: records.length,
        totalFetched
      });

      // Process this batch with transaction
      const batchResult = await this.processBatch(records, batchNumber);

      // Aggregate results
      totalProcessed += batchResult.processed;
      recordsCreated += batchResult.created;
      recordsUpdated += batchResult.updated;
      recordsSkipped += batchResult.skipped;

      conversationsCreated += batchResult.conversationsCreated;
      bookingsCreated += batchResult.bookingsCreated;
      leadsCreated += batchResult.leadsCreated;
      engagedConversations += batchResult.engagedConversations;

      clientsCreated += batchResult.clientsCreated;
      locationsCreated += batchResult.locationsCreated;
      customersCreated += batchResult.customersCreated;
      customersUpdated += batchResult.customersUpdated;

      // Update import log with progress
      await this.updateImportProgress(this.currentImportId, {
        total_records_fetched: totalFetched,
        total_records_processed: totalProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        conversations_created: conversationsCreated,
        bookings_created: bookingsCreated,
        leads_created: leadsCreated,
        engaged_conversations: engagedConversations,
        clients_created: clientsCreated,
        locations_created: locationsCreated,
        customers_created: customersCreated,
        customers_updated: customersUpdated
      });

      batchNumber++;
    }

    return {
      totalFetched,
      totalProcessed,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
      conversationsCreated,
      bookingsCreated,
      leadsCreated,
      engagedConversations,
      clientsCreated,
      locationsCreated,
      customersCreated,
      customersUpdated
    };
  }

  /**
   * Process a single batch with transaction and idempotent operations
   */
  async processBatch(records, batchNumber) {
    const client = await db.getClient();
    const batchStats = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      conversationsCreated: 0,
      bookingsCreated: 0,
      leadsCreated: 0,
      engagedConversations: 0,
      clientsCreated: 0,
      locationsCreated: 0,
      customersCreated: 0,
      customersUpdated: 0
    };

    try {
      await client.query('BEGIN');

      for (const record of records) {
        const recordResult = await this.processRecord(client, record);

        batchStats.processed++;
        batchStats.created += recordResult.created ? 1 : 0;
        batchStats.updated += recordResult.updated ? 1 : 0;
        batchStats.skipped += recordResult.skipped ? 1 : 0;

        batchStats.conversationsCreated += recordResult.conversationCreated ? 1 : 0;
        batchStats.bookingsCreated += recordResult.bookingCreated ? 1 : 0;
        batchStats.leadsCreated += recordResult.leadCreated ? 1 : 0;
        batchStats.engagedConversations += recordResult.engaged ? 1 : 0;

        batchStats.clientsCreated += recordResult.clientCreated ? 1 : 0;
        batchStats.locationsCreated += recordResult.locationCreated ? 1 : 0;
        batchStats.customersCreated += recordResult.customerCreated ? 1 : 0;
        batchStats.customersUpdated += recordResult.customerUpdated ? 1 : 0;
      }

      await client.query('COMMIT');
      return batchStats;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Batch ${batchNumber} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a single record with idempotent operations
   */
  async processRecord(client, airtableRecord) {
    const processedRecord = this.dataProcessor.processRecord(airtableRecord);

    if (!processedRecord) {
      return { skipped: true };
    }

    const result = {
      created: false,
      updated: false,
      skipped: false,
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
      const { clientId, created: clientCreated } = await this.getOrCreateClient(
        client,
        processedRecord.clinic
      );
      result.clientCreated = clientCreated;

      // 2. Get or create location
      const { locationId, created: locationCreated } = await this.getOrCreateLocation(
        client,
        clientId,
        processedRecord.clinic
      );
      result.locationCreated = locationCreated;

      // 3. Get or create customer (idempotent using external_id)
      const { customerId, created: customerCreated, updated: customerUpdated } = await this.getOrCreateCustomer(
        client,
        processedRecord
      );
      result.customerCreated = customerCreated;
      result.customerUpdated = customerUpdated;

      // 4. Get automation ID
      const automationId = await this.getAutomationId(client, processedRecord.automation_code);

      // 5. Create or update conversation (idempotent using external_id)
      const { conversationId, created: conversationCreated } = await this.createOrUpdateConversation(
        client,
        {
          external_id: processedRecord.airtable_id,
          client_id: clientId,
          location_id: locationId,
          automation_id: automationId,
          customer_id: customerId,
          transcript: processedRecord.conversation_transcript,
          engaged: processedRecord.engaged,
          lead_created: processedRecord.lead_created,
          created_at: processedRecord.created_at
        }
      );
      result.conversationCreated = conversationCreated;

      // 6. Create booking if exists (idempotent)
      if (processedRecord.booking_exists && processedRecord.booking_date) {
        const bookingCreated = await this.createBookingIfNotExists(
          client,
          {
            client_id: clientId,
            location_id: locationId,
            automation_id: automationId,
            customer_id: customerId,
            conversation_id: conversationId,
            date: processedRecord.booking_date,
            created_at: processedRecord.created_at
          }
        );
        result.bookingCreated = bookingCreated;
      }

      // 7. Create lead if created (idempotent)
      if (processedRecord.lead_created) {
        const leadCreated = await this.createLeadIfNotExists(
          client,
          {
            client_id: clientId,
            location_id: locationId,
            automation_id: automationId,
            customer_id: customerId,
            conversation_id: conversationId,
            created_at: processedRecord.created_at
          }
        );
        result.leadCreated = leadCreated;
      }

      result.created = conversationCreated;
      return result;

    } catch (error) {
      logger.error('Error processing record:', {
        airtableId: airtableRecord.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get or create client (idempotent)
   */
  async getOrCreateClient(client, clinicName) {
    if (!clinicName) {
      clinicName = 'Unknown Clinic';
    }

    const email = `${clinicName.toLowerCase().replace(/[^a-z0-9]/g, '')}@clinic.com`;

    // Try to get existing client
    const existingResult = await client.query(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );

    if (existingResult.rows.length > 0) {
      return { clientId: existingResult.rows[0].id, created: false };
    }

    // Create new client
    const result = await client.query(`
      INSERT INTO clients (name, company, email, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING id
    `, [clinicName, clinicName, email]);

    return { clientId: result.rows[0].id, created: true };
  }

  /**
   * Get or create location (idempotent)
   */
  async getOrCreateLocation(client, clientId, clinicName) {
    if (!clinicName) {
      clinicName = 'Unknown Location';
    }

    // Try to get existing location for this client
    const existingResult = await client.query(
      'SELECT id FROM locations WHERE client_id = $1',
      [clientId]
    );

    if (existingResult.rows.length > 0) {
      return { locationId: existingResult.rows[0].id, created: false };
    }

    // Create new location
    const result = await client.query(`
      INSERT INTO locations (client_id, name, address, city, state, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id
    `, [clientId, clinicName, '123 Main St', 'Unknown', 'Unknown']);

    const locationId = result.rows[0].id;

    // Ensure all automation types are linked to this location
    await this.linkAllAutomationsToLocation(client, locationId);

    return { locationId, created: true };
  }

  /**
   * Get or create customer (idempotent using external_id)
   */
  async getOrCreateCustomer(client, processedRecord) {
    // Handle records without USER ID by creating a unique identifier
    let externalId = processedRecord.external_id;
    if (!externalId) {
      // Create a unique identifier for records without USER ID
      externalId = `no-user-id-${processedRecord.airtable_id}`;
      logger.warn(`Record ${processedRecord.airtable_id} has no USER ID, using: ${externalId}`);
    }

    // Try to get existing customer
    const existingResult = await client.query(
      'SELECT id FROM customers WHERE external_id = $1',
      [externalId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing customer with latest info
      await client.query(`
        UPDATE customers SET
          name = COALESCE($2, name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          last_activity = $5
        WHERE external_id = $1
      `, [
        externalId,
        processedRecord.name,
        processedRecord.email,
        processedRecord.phone,
        processedRecord.created_at
      ]);

      return { customerId: existingResult.rows[0].id, created: false, updated: true };
    }

    // Create new customer
    const result = await client.query(`
      INSERT INTO customers (external_id, name, email, phone, first_seen, last_activity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      externalId,
      processedRecord.name,
      processedRecord.email,
      processedRecord.phone,
      processedRecord.created_at,
      processedRecord.created_at
    ]);

    return { customerId: result.rows[0].id, created: true, updated: false };
  }

  /**
   * Create or update conversation (idempotent using external_id)
   */
  async createOrUpdateConversation(client, conversationData) {
    // Try to get existing conversation
    const existingResult = await client.query(
      'SELECT id FROM conversations WHERE external_id = $1',
      [conversationData.external_id]
    );

    if (existingResult.rows.length > 0) {
      // Update existing conversation
      await client.query(`
        UPDATE conversations SET
          transcript = COALESCE($2, transcript),
          engaged = $3,
          lead_created = $4
        WHERE external_id = $1
      `, [
        conversationData.external_id,
        conversationData.transcript,
        conversationData.engaged,
        conversationData.lead_created
      ]);

      return { conversationId: existingResult.rows[0].id, created: false };
    }

    // Create new conversation
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

  /**
   * Create booking if not exists (idempotent)
   */
  async createBookingIfNotExists(client, bookingData) {
    // Check if booking already exists for this conversation
    const existingResult = await client.query(
      'SELECT id FROM bookings WHERE conversation_id = $1',
      [bookingData.conversation_id]
    );

    if (existingResult.rows.length > 0) {
      return false; // Already exists
    }

    // Create new booking
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

    return true; // Created
  }

  /**
   * Create lead if not exists (idempotent)
   */
  async createLeadIfNotExists(client, leadData) {
    // Check if lead already exists for this conversation
    const existingResult = await client.query(
      'SELECT id FROM leads WHERE conversation_id = $1',
      [leadData.conversation_id]
    );

    if (existingResult.rows.length > 0) {
      return false; // Already exists
    }

    // Create new lead
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

    return true; // Created
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
   * Ensure all automation types are linked to a location
   */
  async linkAllAutomationsToLocation(client, locationId) {
    await client.query(`
      INSERT INTO location_automations (location_id, automation_id)
      SELECT $1, a.id
      FROM automations a
      WHERE NOT EXISTS (
        SELECT 1 FROM location_automations la
        WHERE la.location_id = $1 AND la.automation_id = a.id
      )
    `, [locationId]);
  }

  /**
   * Ensure all automation types exist and are properly set up
   */
  async ensureAutomationSetup() {
    // This will be called to ensure all automations exist
    // The seed script should have already created them
    const automations = await db.query('SELECT COUNT(*) as count FROM automations');

    if (parseInt(automations.rows[0].count) === 0) {
      logger.warn('No automations found - running seed data');
      // Could trigger seeding here if needed
    }
  }

  /**
   * Validate database and Airtable connections
   */
  async validateConnections() {
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    const airtableConnected = await this.airtableService.testConnection();
    if (!airtableConnected) {
      throw new Error('Airtable connection failed');
    }
  }

  /**
   * Get the timestamp of the last successful import for incremental imports
   */
  async getLastSuccessfulImportTimestamp() {
    const result = await db.query(`
      SELECT completed_at
      FROM import_logs
      WHERE status = 'completed' AND incremental = false
      ORDER BY completed_at DESC
      LIMIT 1
    `);

    return result.rows.length > 0 ? result.rows[0].completed_at : null;
  }

  /**
   * Import log management methods
   */
  async createImportLog(options) {
    const result = await db.query(`
      INSERT INTO import_logs (
        import_type, status, triggered_by, incremental, notes, started_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `, [
      'airtable_sync',
      'running',
      options.triggeredBy,
      options.incremental,
      options.notes
    ]);

    return result.rows[0].id;
  }

  async updateImportProgress(importId, stats) {
    await db.query(`
      UPDATE import_logs SET
        total_records_fetched = $2,
        total_records_processed = $3,
        records_created = $4,
        records_updated = $5,
        conversations_created = $6,
        bookings_created = $7,
        leads_created = $8,
        engaged_conversations = $9,
        clients_created = $10,
        locations_created = $11,
        customers_created = $12,
        customers_updated = $13
      WHERE id = $1
    `, [
      importId,
      stats.total_records_fetched,
      stats.total_records_processed,
      stats.records_created,
      stats.records_updated,
      stats.conversations_created,
      stats.bookings_created,
      stats.leads_created,
      stats.engaged_conversations,
      stats.clients_created,
      stats.locations_created,
      stats.customers_created,
      stats.customers_updated
    ]);
  }

  async completeImportLog(importId, stats) {
    await db.query(`
      UPDATE import_logs SET
        status = $2,
        completed_at = NOW(),
        total_records_fetched = $3,
        total_records_processed = $4,
        records_created = $5,
        records_updated = $6,
        conversations_created = $7,
        bookings_created = $8,
        leads_created = $9,
        engaged_conversations = $10,
        clients_created = $11,
        locations_created = $12,
        customers_created = $13,
        customers_updated = $14,
        duration_seconds = $15,
        records_per_second = $16
      WHERE id = $1
    `, [
      importId,
      stats.status,
      stats.totalFetched,
      stats.totalProcessed,
      stats.recordsCreated,
      stats.recordsUpdated,
      stats.conversationsCreated,
      stats.bookingsCreated,
      stats.leadsCreated,
      stats.engagedConversations,
      stats.clientsCreated,
      stats.locationsCreated,
      stats.customersCreated,
      stats.customersUpdated,
      stats.duration_seconds,
      stats.records_per_second
    ]);
  }

  async failImportLog(importId, errorMessage) {
    await db.query(`
      UPDATE import_logs SET
        status = 'failed',
        completed_at = NOW(),
        error_message = $2,
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
      WHERE id = $1
    `, [importId, errorMessage]);
  }

  /**
   * Log validation results
   */
  logValidationResults(validation) {
    logger.info('Import validation results:', {
      bookings: `${validation.bookings.actual}/${validation.bookings.expected} ${validation.bookings.match ? '✓' : '✗'}`,
      leads: `${validation.leads.actual}/${validation.leads.expected} ${validation.leads.match ? '✓' : '✗'}`,
      engaged: `${validation.engaged.actual}/${validation.engaged.expected} ${validation.engaged.match ? '✓' : '✗'}`
    });
  }

  /**
   * Check if import is currently running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentImportId: this.currentImportId
    };
  }
}

module.exports = ImportService;