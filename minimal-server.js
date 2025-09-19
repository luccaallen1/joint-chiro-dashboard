const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple dashboard endpoint
app.get('/api/simple-metrics/dashboard', (req, res) => {
  const { clinic, period } = req.query;
  console.log('Dashboard request:', { clinic, period });

  let totals = {
    conversations: 13373,
    bookings: 2092,
    leads: 9270,
    engaged: 5295
  };

  // Apply Oxford-specific filtering
  if (clinic === 'Oxford') {
    totals.conversations = 343;
    totals.bookings = 80;
    totals.leads = 200;
    totals.engaged = 150;
  }

  // Apply September filtering
  if (period === '09' || period === '9') {
    totals.conversations = Math.round(totals.conversations * 0.125);
    totals.bookings = Math.round(totals.bookings * 0.125);
    totals.leads = Math.round(totals.leads * 0.125);
    totals.engaged = Math.round(totals.engaged * 0.125);
  }

  const dashboardData = {
    totals,
    trend: [
      { month: 'Feb', conversations: 1890, bookings: 292, leads: 1309, engaged: 744 },
      { month: 'Mar', conversations: 2890, bookings: 447, leads: 2002, engaged: 1139 },
      { month: 'Apr', conversations: 3120, bookings: 483, leads: 2161, engaged: 1230 },
      { month: 'May', conversations: 2987, bookings: 462, leads: 2070, engaged: 1178 },
      { month: 'Jun', conversations: 2456, bookings: 380, leads: 1703, engaged: 969 },
      { month: 'Jul', conversations: 2234, bookings: 346, leads: 1549, engaged: 881 },
      { month: 'Aug', conversations: 2134, bookings: 330, leads: 1479, engaged: 842 },
      { month: 'Sep', conversations: 1412, bookings: 218, leads: 979, engaged: 557 }
    ],
    topLocations: [],
    automationBreakdown: {},
    clinics: [
      { id: "all", name: "All Locations" },
      { id: "Oxford", name: "Oxford" },
      { id: "Gadsden", name: "Gadsden" },
      { id: "Greenville", name: "Greenville" }
    ],
    isLoading: false,
    error: null
  };

  res.json(dashboardData);
});

app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/simple-metrics/dashboard`);
});