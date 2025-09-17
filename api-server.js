const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/db/connection.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dashboard/dist')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.testConnection();
    res.json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Get list of tables
app.get('/api/tables', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = result.rows.map(row => row.table_name);
    res.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get data from a specific table
app.get('/api/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;

    // Basic security check - only allow alphanumeric and underscore
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // Get table data with a limit for performance
    const result = await db.query(`SELECT * FROM "${tableName}" LIMIT 1000`);

    res.json({
      tableName,
      rows: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error(`Error fetching data from ${req.params.tableName}:`, error);
    res.status(500).json({ error: `Failed to fetch data from ${req.params.tableName}` });
  }
});

// Get table schema
app.get('/api/tables/:tableName/schema', async (req, res) => {
  try {
    const { tableName } = req.params;

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);

    res.json({
      tableName,
      columns: result.rows
    });
  } catch (error) {
    console.error(`Error fetching schema for ${req.params.tableName}:`, error);
    res.status(500).json({ error: `Failed to fetch schema for ${req.params.tableName}` });
  }
});

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
  console.log(`🗄️ Database viewer at http://localhost:${PORT}/database`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down API server...');
  await db.close();
  process.exit(0);
});