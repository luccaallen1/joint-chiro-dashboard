const express = require('express');
const cors = require('cors');
require('dotenv').config();

const testRoutes = require('./routes/test');
const { router: importRoutes, ensureSchedulerInitialized } = require('./routes/import');
const metricsRoutes = require('./routes/metrics');
const simpleMetricsRoutes = require('./routes/simple-metrics');
const databaseRoutes = require('./routes/database');
const db = require('./db/connection');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/test', testRoutes);
app.use('/api/import', importRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/simple-metrics', simpleMetricsRoutes);
app.use('/api/database', databaseRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();

    // Get scheduler status
    const scheduler = ensureSchedulerInitialized();
    const schedulerStatus = scheduler.getStatus();

    // Get basic system stats
    const systemStats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM conversations) as conversations,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM leads) as leads,
        (SELECT COUNT(*) FROM clients) as clients
    `);

    const stats = systemStats.rows[0];

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      scheduler: {
        initialized: schedulerStatus.initialized,
        tasksRunning: Object.values(schedulerStatus.tasks).filter(t => t.running).length,
        importRunning: schedulerStatus.importServiceStatus.isRunning
      },
      data: {
        conversations: parseInt(stats.conversations),
        bookings: parseInt(stats.bookings),
        leads: parseInt(stats.leads),
        clients: parseInt(stats.clients)
      },
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'JointChiro Data Dashboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      import: {
        trigger: 'POST /api/import/trigger',
        status: '/api/import/status',
        history: '/api/import/history',
        stats: '/api/import/stats',
        scheduler: {
          start: 'POST /api/import/scheduler/start',
          stop: 'POST /api/import/scheduler/stop'
        }
      },
      test: {
        airtableConnection: '/api/test/airtable-connection',
        dataProcessor: '/api/test/data-processor',
        dbStats: '/api/test/db-stats'
      }
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server with scheduler initialization
if (require.main === module) {
  app.listen(PORT, async () => {
    logger.info(`🚀 JointChiro Data Dashboard API running on port ${PORT}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`📊 Import endpoints: http://localhost:${PORT}/api/import/status`);

    try {
      // Initialize and start the scheduler
      const scheduler = ensureSchedulerInitialized();
      scheduler.start();

      // Skip initial import on startup to prevent hanging
      logger.info('Server started successfully. Scheduler initialized.');
      logger.info('Initial import skipped on startup for faster startup time.');

    } catch (error) {
      logger.error('Failed to start scheduler:', error);
      // Don't exit - the server can still function for manual imports
    }
  });
}

module.exports = app;