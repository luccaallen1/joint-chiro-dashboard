const express = require('express');
const router = express.Router();
const ImportScheduler = require('../services/scheduler');
const db = require('../db/connection');
const logger = require('../utils/logger');

// Global scheduler instance
let scheduler;

/**
 * Initialize scheduler if not already initialized
 */
function ensureSchedulerInitialized() {
  if (!scheduler) {
    scheduler = new ImportScheduler();
  }
  return scheduler;
}

/**
 * Trigger manual import
 * POST /api/import/trigger
 */
router.post('/trigger', async (req, res) => {
  try {
    const { incremental = true, notes } = req.body;

    logger.info('Manual import trigger requested', { incremental, notes });

    const importScheduler = ensureSchedulerInitialized();

    // Check if import is already running
    const status = importScheduler.getStatus();
    if (status.importServiceStatus.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Import is already running',
        currentImportId: status.importServiceStatus.currentImportId,
        timestamp: new Date().toISOString()
      });
    }

    // Start the import
    const result = await importScheduler.triggerManualImport({
      incremental,
      notes: notes || 'Manual import via API'
    });

    res.json({
      success: true,
      message: 'Import completed successfully',
      importId: result.importId,
      stats: {
        totalProcessed: result.totalProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        conversationsCreated: result.conversationsCreated,
        bookingsCreated: result.bookingsCreated,
        leadsCreated: result.leadsCreated,
        engagedConversations: result.engagedConversations,
        clientsCreated: result.clientsCreated,
        locationsCreated: result.locationsCreated,
        customersCreated: result.customersCreated,
        customersUpdated: result.customersUpdated
      },
      performance: {
        durationSeconds: result.durationSeconds,
        recordsPerSecond: result.recordsPerSecond
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Manual import trigger failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get current import status
 * GET /api/import/status
 */
router.get('/status', async (req, res) => {
  try {
    const importScheduler = ensureSchedulerInitialized();
    const schedulerStatus = importScheduler.getStatus();
    const nextRuns = importScheduler.getNextScheduledRuns();

    // Get last import log
    const lastImportResult = await db.query(`
      SELECT *
      FROM import_logs
      ORDER BY started_at DESC
      LIMIT 1
    `);

    const lastImport = lastImportResult.rows[0];

    // Get current running import if any
    let currentImport = null;
    if (schedulerStatus.importServiceStatus.isRunning) {
      const currentImportResult = await db.query(`
        SELECT *
        FROM import_logs
        WHERE id = $1
      `, [schedulerStatus.importServiceStatus.currentImportId]);

      currentImport = currentImportResult.rows[0];
    }

    // Get summary stats from last completed import
    const lastCompletedResult = await db.query(`
      SELECT *
      FROM import_logs
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    `);

    const lastCompleted = lastCompletedResult.rows[0];

    res.json({
      success: true,
      status: {
        isRunning: schedulerStatus.importServiceStatus.isRunning,
        currentImportId: schedulerStatus.importServiceStatus.currentImportId,
        schedulerInitialized: schedulerStatus.initialized,
        totalScheduledTasks: schedulerStatus.totalTasks
      },
      scheduler: {
        tasks: schedulerStatus.tasks,
        nextScheduledRuns: nextRuns
      },
      lastImport: lastImport ? {
        id: lastImport.id,
        status: lastImport.status,
        startedAt: lastImport.started_at,
        completedAt: lastImport.completed_at,
        triggeredBy: lastImport.triggered_by,
        incremental: lastImport.incremental,
        totalProcessed: lastImport.total_records_processed,
        durationSeconds: lastImport.duration_seconds,
        recordsPerSecond: lastImport.records_per_second
      } : null,
      currentImport: currentImport ? {
        id: currentImport.id,
        startedAt: currentImport.started_at,
        triggeredBy: currentImport.triggered_by,
        incremental: currentImport.incremental,
        totalProcessed: currentImport.total_records_processed,
        progress: {
          recordsFetched: currentImport.total_records_fetched,
          recordsProcessed: currentImport.total_records_processed,
          conversationsCreated: currentImport.conversations_created,
          bookingsCreated: currentImport.bookings_created,
          leadsCreated: currentImport.leads_created
        }
      } : null,
      lastCompleted: lastCompleted ? {
        completedAt: lastCompleted.completed_at,
        totalProcessed: lastCompleted.total_records_processed,
        stats: {
          conversations: lastCompleted.conversations_created,
          bookings: lastCompleted.bookings_created,
          leads: lastCompleted.leads_created,
          engaged: lastCompleted.engaged_conversations,
          clients: lastCompleted.clients_created,
          locations: lastCompleted.locations_created,
          customers: lastCompleted.customers_created
        },
        rates: {
          bookingRate: lastCompleted.bookings_created && lastCompleted.conversations_created
            ? ((lastCompleted.bookings_created / lastCompleted.conversations_created) * 100).toFixed(1) + '%'
            : '0%',
          leadRate: lastCompleted.leads_created && lastCompleted.conversations_created
            ? ((lastCompleted.leads_created / lastCompleted.conversations_created) * 100).toFixed(1) + '%'
            : '0%',
          engagementRate: lastCompleted.engaged_conversations && lastCompleted.conversations_created
            ? ((lastCompleted.engaged_conversations / lastCompleted.conversations_created) * 100).toFixed(1) + '%'
            : '0%'
        }
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting import status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get import history
 * GET /api/import/history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(`
      SELECT
        id,
        import_type,
        status,
        started_at,
        completed_at,
        triggered_by,
        incremental,
        total_records_fetched,
        total_records_processed,
        records_created,
        records_updated,
        conversations_created,
        bookings_created,
        leads_created,
        engaged_conversations,
        clients_created,
        locations_created,
        customers_created,
        customers_updated,
        error_count,
        error_message,
        duration_seconds,
        records_per_second,
        notes
      FROM import_logs
      ORDER BY started_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count for pagination
    const countResult = await db.query('SELECT COUNT(*) as total FROM import_logs');
    const totalRecords = parseInt(countResult.rows[0].total);

    const imports = result.rows.map(row => ({
      id: row.id,
      type: row.import_type,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      triggeredBy: row.triggered_by,
      incremental: row.incremental,
      stats: {
        fetched: row.total_records_fetched,
        processed: row.total_records_processed,
        created: row.records_created,
        updated: row.records_updated,
        conversations: row.conversations_created,
        bookings: row.bookings_created,
        leads: row.leads_created,
        engaged: row.engaged_conversations,
        clients: row.clients_created,
        locations: row.locations_created,
        customers: row.customers_created,
        customersUpdated: row.customers_updated
      },
      performance: {
        durationSeconds: row.duration_seconds,
        recordsPerSecond: row.records_per_second
      },
      errors: {
        count: row.error_count,
        message: row.error_message
      },
      rates: row.conversations_created > 0 ? {
        bookingRate: row.bookings_created
          ? ((row.bookings_created / row.conversations_created) * 100).toFixed(1) + '%'
          : '0%',
        leadRate: row.leads_created
          ? ((row.leads_created / row.conversations_created) * 100).toFixed(1) + '%'
          : '0%',
        engagementRate: row.engaged_conversations
          ? ((row.engaged_conversations / row.conversations_created) * 100).toFixed(1) + '%'
          : '0%'
      } : null,
      notes: row.notes
    }));

    res.json({
      success: true,
      imports,
      pagination: {
        total: totalRecords,
        limit,
        offset,
        hasMore: offset + limit < totalRecords
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting import history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get import statistics summary
 * GET /api/import/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // Get overall database statistics
    const dbStats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as total_conversations,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM conversations WHERE engaged = true) as total_engaged,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM locations) as total_locations,
        (SELECT COUNT(*) FROM customers) as total_customers
    `);

    const stats = dbStats.rows[0];

    // Get import summary statistics
    const importStats = await db.query(`
      SELECT
        COUNT(*) as total_imports,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_imports,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_imports,
        COUNT(*) FILTER (WHERE status = 'running') as running_imports,
        SUM(total_records_processed) as total_records_processed,
        AVG(duration_seconds) FILTER (WHERE status = 'completed') as avg_duration_seconds,
        AVG(records_per_second) FILTER (WHERE status = 'completed') as avg_records_per_second,
        MAX(completed_at) as last_successful_import
      FROM import_logs
    `);

    const importSummary = importStats.rows[0];

    // Calculate rates based on current data
    const totalConversations = parseInt(stats.total_conversations);
    const rates = totalConversations > 0 ? {
      bookingRate: ((parseInt(stats.total_bookings) / totalConversations) * 100).toFixed(1) + '%',
      leadRate: ((parseInt(stats.total_leads) / totalConversations) * 100).toFixed(1) + '%',
      engagementRate: ((parseInt(stats.total_engaged) / totalConversations) * 100).toFixed(1) + '%'
    } : {
      bookingRate: '0%',
      leadRate: '0%',
      engagementRate: '0%'
    };

    // Expected vs actual metrics
    const expectedMetrics = {
      totalConversations: 20077,
      bookings: 3122,
      leads: 13908,
      engaged: 7910
    };

    const validation = {
      conversations: {
        expected: expectedMetrics.totalConversations,
        actual: totalConversations,
        match: totalConversations === expectedMetrics.totalConversations
      },
      bookings: {
        expected: expectedMetrics.bookings,
        actual: parseInt(stats.total_bookings),
        match: parseInt(stats.total_bookings) === expectedMetrics.bookings
      },
      leads: {
        expected: expectedMetrics.leads,
        actual: parseInt(stats.total_leads),
        match: parseInt(stats.total_leads) === expectedMetrics.leads
      },
      engaged: {
        expected: expectedMetrics.engaged,
        actual: parseInt(stats.total_engaged),
        match: parseInt(stats.total_engaged) === expectedMetrics.engaged
      }
    };

    res.json({
      success: true,
      currentData: {
        conversations: parseInt(stats.total_conversations),
        bookings: parseInt(stats.total_bookings),
        leads: parseInt(stats.total_leads),
        engaged: parseInt(stats.total_engaged),
        clients: parseInt(stats.total_clients),
        locations: parseInt(stats.total_locations),
        customers: parseInt(stats.total_customers)
      },
      rates,
      importSummary: {
        totalImports: parseInt(importSummary.total_imports),
        successful: parseInt(importSummary.successful_imports),
        failed: parseInt(importSummary.failed_imports),
        running: parseInt(importSummary.running_imports),
        totalRecordsProcessed: parseInt(importSummary.total_records_processed) || 0,
        averageDurationSeconds: parseFloat(importSummary.avg_duration_seconds) || 0,
        averageRecordsPerSecond: parseFloat(importSummary.avg_records_per_second) || 0,
        lastSuccessfulImport: importSummary.last_successful_import
      },
      validation,
      expectedMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting import statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Start/stop scheduler
 * POST /api/import/scheduler/start
 * POST /api/import/scheduler/stop
 */
router.post('/scheduler/:action', async (req, res) => {
  try {
    const { action } = req.params;

    if (!['start', 'stop'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "start" or "stop"',
        timestamp: new Date().toISOString()
      });
    }

    const importScheduler = ensureSchedulerInitialized();

    if (action === 'start') {
      importScheduler.start();
      logger.info('Import scheduler started via API');
    } else {
      importScheduler.stop();
      logger.info('Import scheduler stopped via API');
    }

    const status = importScheduler.getStatus();

    res.json({
      success: true,
      message: `Scheduler ${action}ed successfully`,
      schedulerStatus: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error ${req.params.action}ing scheduler:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = { router, ensureSchedulerInitialized };