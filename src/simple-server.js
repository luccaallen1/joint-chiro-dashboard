const express = require('express');
const cors = require('cors');
require('dotenv').config();

const metricsRoutes = require('./routes/metrics');
const clinicMetricsRoutes = require('./routes/clinic-metrics');
const db = require('./db/connection');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/metrics', metricsRoutes);
app.use('/api/clinic-metrics', clinicMetricsRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();

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
    name: 'JointChiro Data Dashboard API (Simple)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      metrics: {
        overview: '/api/metrics/overview',
        byClinic: '/api/metrics/by-clinic/:clinicName',
        clinics: '/api/metrics/clinics'
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
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server without scheduler
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 JointChiro Simple API running on port ${PORT}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`📊 Metrics: http://localhost:${PORT}/api/metrics/overview`);
  });
}

module.exports = app;