const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const logger = require('../utils/logger');

/**
 * Get metrics for a specific clinic
 * GET /api/clinic-metrics/:clinicName
 */
router.get('/:clinicName', async (req, res) => {
  try {
    const { clinicName } = req.params;

    logger.info(`Fetching metrics for clinic: ${clinicName}`);

    const result = await db.query(`
      SELECT
        c.name as clinic_name,
        COUNT(DISTINCT conv.id) as total_conversations,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT CASE WHEN conv.engaged = true THEN conv.id END) as engaged_conversations
      FROM clients c
      LEFT JOIN conversations conv ON c.id = conv.client_id
      LEFT JOIN bookings b ON conv.id = b.conversation_id
      LEFT JOIN leads l ON conv.id = l.conversation_id
      WHERE c.name = $1
      GROUP BY c.name
    `, [clinicName]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Clinic not found',
        clinicName
      });
    }

    const clinicData = result.rows[0];

    res.json({
      success: true,
      clinic: clinicName,
      metrics: {
        bookings: parseInt(clinicData.total_bookings),
        leads: parseInt(clinicData.total_leads),
        engaged: parseInt(clinicData.engaged_conversations),
        conversations: parseInt(clinicData.total_conversations)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching clinic metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clinic metrics',
      message: error.message
    });
  }
});

/**
 * Get all clinic names
 * GET /api/clinic-metrics/list/all
 */
router.get('/list/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT name
      FROM clients
      WHERE name NOT IN ('Default Clinic', 'Demo Clinic', 'Test', 'Unknown Clinic', 'DB', 'EB', 'IB', 'CB', 'TB', 'WB', 'mybot')
      ORDER BY name
    `);

    const clinics = result.rows.map(row => row.name);

    res.json({
      success: true,
      clinics,
      count: clinics.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching clinic list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clinic list',
      message: error.message
    });
  }
});

module.exports = router;