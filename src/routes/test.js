const express = require('express');
const router = express.Router();
const AirtableService = require('../services/airtable.service');
const DataProcessor = require('../services/dataProcessor');
const db = require('../db/connection');

/**
 * Test Airtable connection and data processing
 * GET /api/test/airtable-connection
 */
router.get('/airtable-connection', async (req, res) => {
  try {
    console.log('Testing Airtable connection via API endpoint...');

    const airtableService = new AirtableService();
    const dataProcessor = new DataProcessor();

    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }

    // Test Airtable connection
    const airtableConnected = await airtableService.testConnection();
    if (!airtableConnected) {
      return res.status(500).json({
        success: false,
        error: 'Airtable connection failed',
        timestamp: new Date().toISOString()
      });
    }

    // Get sample records for testing
    console.log('Fetching sample records...');
    const sampleRecords = await airtableService.getSampleRecords(10);

    // Process sample records
    const processedSamples = sampleRecords.map(record => {
      return dataProcessor.processRecord(record);
    }).filter(record => record !== null);

    // Get record count
    console.log('Getting total record count...');
    const totalCount = await airtableService.getRecordCount();

    // Get current stats
    const stats = dataProcessor.getStats();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      connections: {
        database: dbConnected,
        airtable: airtableConnected
      },
      airtable: {
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_ID,
        totalRecords: totalCount,
        expectedRecords: 20077
      },
      sampleData: {
        recordsFetched: sampleRecords.length,
        recordsProcessed: processedSamples.length,
        processingStats: stats,
        samples: processedSamples.slice(0, 3) // Show first 3 processed samples
      },
      expectedMetrics: {
        totalRecords: 20077,
        bookings: 3122,
        leads: 13908,
        engaged: 7910
      },
      ready: dbConnected && airtableConnected
    };

    console.log('Test completed successfully');
    res.json(response);

  } catch (error) {
    console.error('Test endpoint error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test data processor with specific scenarios
 * GET /api/test/data-processor
 */
router.get('/data-processor', async (req, res) => {
  try {
    console.log('Testing data processor with test scenarios...');

    const dataProcessor = new DataProcessor();

    // Test scenarios for exact processing rules
    const testScenarios = [
      // Booking scenarios
      {
        id: 'test-booking-1',
        fields: {
          'User ID': 'user123',
          'Name': 'John Doe',
          'Clinic': 'Test Clinic',
          'Automation': 'WB',
          'Booking': 'Thu Oct 02 2025 18:30:00 GMT+0300',
          'Lead Created': 'Yes',
          'Engaged in conversation': 'TRUE'
        }
      },
      // UTM parameter removal test
      {
        id: 'test-utm-1',
        fields: {
          'User ID': 'user456',
          'Automation': 'WEB?UTM_MEDIUM=ANDY&UTM_SOURCE=test',
          'Booking': 'No booking',
          'Lead Created': 'No',
          'Engaged in conversation': 'FALSE'
        }
      },
      // WEB to WB mapping test
      {
        id: 'test-web-mapping',
        fields: {
          'User ID': 'user789',
          'Automation': 'WEB',
          'Booking': '2025-09-15T10:00',
          'Lead Created': 'Yes',
          'Engaged in conversation': 'True'
        }
      },
      // Default automation test
      {
        id: 'test-default',
        fields: {
          'User ID': 'user000',
          'Automation': null,
          'Booking': 'Some text without 2025',
          'Lead Created': 'Maybe',
          'Engaged in conversation': 'true'
        }
      }
    ];

    const results = testScenarios.map(scenario => {
      const processed = dataProcessor.processRecord(scenario);
      return {
        input: scenario,
        output: processed
      };
    });

    const stats = dataProcessor.getStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      testResults: results,
      processingStats: stats,
      validationRules: {
        booking: 'Booking exists when Booking column contains "2025"',
        lead: 'Lead created when "Lead Created" field equals exactly "Yes"',
        engaged: 'Engaged when "Engaged in conversation" equals "TRUE" or "True" or "true"',
        automation: 'Remove UTM parameters, map WEB to WB, default to DB for invalid codes'
      }
    });

  } catch (error) {
    console.error('Data processor test error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get database statistics
 * GET /api/test/db-stats
 */
router.get('/db-stats', async (req, res) => {
  try {
    console.log('Fetching database statistics...');

    // Get counts from each table
    const tables = ['clients', 'locations', 'customers', 'automations', 'conversations', 'bookings', 'leads'];
    const stats = {};

    for (const table of tables) {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = parseInt(result.rows[0].count);
    }

    // Get additional metrics
    const bookingStats = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM bookings
      GROUP BY status
    `);

    const leadStats = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM leads
      GROUP BY status
    `);

    const automationUsage = await db.query(`
      SELECT
        a.code,
        a.name,
        COUNT(c.id) as conversation_count
      FROM automations a
      LEFT JOIN conversations c ON c.automation_id = a.id
      GROUP BY a.id, a.code, a.name
      ORDER BY conversation_count DESC
    `);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      tableCounts: stats,
      bookingStatuses: bookingStats.rows,
      leadStatuses: leadStats.rows,
      automationUsage: automationUsage.rows,
      totalRecords: Object.values(stats).reduce((sum, count) => sum + count, 0)
    });

  } catch (error) {
    console.error('Database stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;