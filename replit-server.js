const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check for Replit
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    message: 'JointChiro Dashboard API',
    dashboard: '/dashboard',
    api: '/api/simple-metrics/dashboard',
    timestamp: new Date().toISOString()
  });
});

// API Routes - use simple metrics to avoid timeouts
app.use('/api/simple-metrics', require('./src/routes/simple-metrics'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dashboard/dist')));

// Catch-all route for React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

// Schedule automatic imports (6 AM and 6 PM)
if (process.env.ENABLE_SCHEDULER === 'true') {
  console.log('📅 Scheduler enabled');

  // Run at 6 AM and 6 PM every day
  cron.schedule('0 6,18 * * *', async () => {
    console.log('🔄 Running scheduled import from Airtable...');
    try {
      const { spawn } = require('child_process');
      const importProcess = spawn('node', ['proper-import.js']);

      importProcess.stdout.on('data', (data) => {
        console.log(`Import: ${data}`);
      });

      importProcess.stderr.on('data', (data) => {
        console.error(`Import Error: ${data}`);
      });

      importProcess.on('close', (code) => {
        console.log(`Import process exited with code ${code}`);
      });
    } catch (error) {
      console.error('Failed to run import:', error);
    }
  });

  // Also run import on startup if database is empty
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.query('SELECT COUNT(*) FROM conversations', (err, result) => {
    if (!err && result.rows[0].count === '0') {
      console.log('📦 Database empty, running initial import...');
      const { spawn } = require('child_process');
      spawn('node', ['proper-import.js']);
    }
    pool.end();
  });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📊 API: http://localhost:${PORT}/api/simple-metrics/dashboard`);

  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Running in production mode');
  }
});