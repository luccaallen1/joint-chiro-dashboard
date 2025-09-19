const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const logger = require('../utils/logger');

// Get data from any table (with safety checks)
router.get('/:table', async (req, res) => {
  const { table } = req.params;
  const { limit = 100, offset = 0, orderBy = 'created_at', order = 'DESC' } = req.query;

  // Whitelist of allowed tables
  const allowedTables = ['conversations', 'bookings', 'leads', 'clients', 'locations', 'automations', 'customers'];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({
      error: 'Invalid table name',
      allowedTables
    });
  }

  try {
    // Build query safely - check if orderBy column exists
    let orderColumn = 'id'; // default fallback
    if (table === 'conversations' || table === 'bookings' || table === 'leads') {
      orderColumn = 'created_at';
    }

    const query = `
      SELECT * FROM ${table}
      ORDER BY ${orderColumn} ${order === 'ASC' ? 'ASC' : 'DESC'} NULLS LAST
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    logger.error(`Error fetching data from ${table}:`, error);
    res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
});

// Get table statistics
router.get('/:table/stats', async (req, res) => {
  const { table } = req.params;

  const allowedTables = ['conversations', 'bookings', 'leads', 'clients', 'locations', 'automations', 'customers'];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({
      error: 'Invalid table name',
      allowedTables
    });
  }

  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(DISTINCT client_id) as unique_clients,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM ${table}
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    logger.error(`Error fetching stats for ${table}:`, error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;