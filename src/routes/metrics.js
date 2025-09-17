const express = require('express');
const db = require('../db/connection');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/metrics/overview - Get overall metrics for all clinics
router.get('/overview', async (req, res) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as total_bookings,
        (SELECT COUNT(*) FROM leads WHERE status = 'created') as total_leads,
        (SELECT COUNT(*) FROM conversations WHERE engaged = true) as total_engaged
    `;

    const result = await db.query(query);
    const metrics = result.rows[0];

    res.json({
      bookings: parseInt(metrics.total_bookings) || 0,
      leads: parseInt(metrics.total_leads) || 0,
      engaged: parseInt(metrics.total_engaged) || 0
    });

  } catch (error) {
    logger.error('Error fetching overview metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch overview metrics',
      message: error.message
    });
  }
});

// GET /api/metrics/by-clinic/:clinicName - Get metrics for specific clinic
router.get('/by-clinic/:clinicName', async (req, res) => {
  try {
    const { clinicName } = req.params;

    // First get the clinic/location ID
    const clinicQuery = `
      SELECT id FROM locations WHERE name ILIKE $1
    `;
    const clinicResult = await db.query(clinicQuery, [clinicName]);

    if (clinicResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Clinic not found',
        message: `No clinic found with name: ${clinicName}`
      });
    }

    const clinicId = clinicResult.rows[0].id;

    // Get metrics for this specific clinic
    const metricsQuery = `
      SELECT
        (SELECT COUNT(*) FROM bookings b
         JOIN conversations c ON b.conversation_id = c.id
         WHERE c.location_id = $1 AND b.status = 'completed') as clinic_bookings,
        (SELECT COUNT(*) FROM leads l
         JOIN conversations c ON l.conversation_id = c.id
         WHERE c.location_id = $1 AND l.status = 'created') as clinic_leads,
        (SELECT COUNT(*) FROM conversations
         WHERE location_id = $1 AND engaged = true) as clinic_engaged
    `;

    const result = await db.query(metricsQuery, [clinicId]);
    const metrics = result.rows[0];

    res.json({
      clinic: clinicName,
      bookings: parseInt(metrics.clinic_bookings) || 0,
      leads: parseInt(metrics.clinic_leads) || 0,
      engaged: parseInt(metrics.clinic_engaged) || 0
    });

  } catch (error) {
    logger.error(`Error fetching metrics for clinic ${req.params.clinicName}:`, error);
    res.status(500).json({
      error: 'Failed to fetch clinic metrics',
      message: error.message
    });
  }
});

// GET /api/metrics/clinics - Get list of all clinic names
router.get('/clinics', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT name
      FROM locations
      WHERE name IS NOT NULL
      ORDER BY name ASC
    `;

    const result = await db.query(query);
    const clinics = result.rows.map(row => row.name);

    res.json({
      clinics,
      count: clinics.length
    });

  } catch (error) {
    logger.error('Error fetching clinic list:', error);
    res.status(500).json({
      error: 'Failed to fetch clinic list',
      message: error.message
    });
  }
});

module.exports = router;