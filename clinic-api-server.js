const express = require('express');
const cors = require('cors');
const { getClinicData } = require('./get-clinic-data');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Get clinic metrics endpoint
app.get('/api/clinic-metrics/:clinicName', async (req, res) => {
  try {
    const { clinicName } = req.params;
    console.log(`Fetching data for clinic: ${clinicName}`);

    const data = await getClinicData(clinicName);

    if (data.found) {
      res.json({
        success: true,
        clinic: clinicName,
        metrics: {
          bookings: data.bookings,
          leads: data.leads,
          engaged: data.engaged
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Clinic not found',
        clinic: clinicName
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Clinic API Server running on port ${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/clinic-metrics/Oxford`);
});