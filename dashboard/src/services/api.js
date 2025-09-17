import axios from 'axios';

// Configure axios with base URL and timeout
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API service methods
export const dashboardAPI = {
  // Get system health
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Get import statistics
  getImportStats: async () => {
    const response = await api.get('/import/stats');
    return response.data;
  },

  // Get import status
  getImportStatus: async () => {
    const response = await api.get('/import/status');
    return response.data;
  },

  // Get database statistics
  getDatabaseStats: async () => {
    const response = await api.get('/test/db-stats');
    return response.data;
  },

  // Trigger manual import
  triggerImport: async (incremental = true) => {
    const response = await api.post('/import/trigger', { incremental });
    return response.data;
  },

  // Get clinic performance data
  getClinicPerformance: async (params = {}) => {
    const response = await api.get('/clinic-performance', { params });
    return response.data;
  },

  // Get trend data for charts
  getTrendData: async (params = {}) => {
    const response = await api.get('/trend-data', { params });
    return response.data;
  },

  // Test Airtable connection
  testAirtableConnection: async () => {
    const response = await api.get('/test/airtable-connection');
    return response.data;
  },

  // Get overall metrics for all clinics
  getOverviewMetrics: async () => {
    const response = await api.get('/metrics/overview');
    return response.data;
  },

  // Get metrics for specific clinic
  getClinicMetrics: async (clinicName) => {
    const response = await api.get(`/metrics/by-clinic/${encodeURIComponent(clinicName)}`);
    return response.data;
  },

  // Get list of all clinic names
  getClinicsList: async () => {
    const response = await api.get('/metrics/clinics');
    return response.data;
  }
};

// Mock data generator for development/demo purposes
export const mockAPI = {
  // Generate mock clinic data
  getClinicPerformance: () => {
    const clinics = [
      'Gadsden', 'Oxford', 'Greenville', 'Mt. Prospect', 'Capitol Hill',
      'Santa Maria', 'New Bern', 'Clarksville IN', 'Wall Township', 'Danville VA',
      'Richmond', 'Newport News', 'Chesapeake', 'Virginia Beach', 'Norfolk',
      'Lynchburg', 'Roanoke', 'Blacksburg', 'Harrisonburg', 'Fredericksburg'
    ];

    return clinics.map((name, index) => {
      const baseConversations = Math.floor(Math.random() * 400) + 100;
      const engagementRate = Math.random() * 0.4 + 0.2; // 20-60%
      const leadRate = Math.random() * 0.3 + 0.5; // 50-80%
      const bookingRate = Math.random() * 0.15 + 0.1; // 10-25%

      const engaged = Math.floor(baseConversations * engagementRate);
      const leads = Math.floor(baseConversations * leadRate);
      const bookings = Math.floor(baseConversations * bookingRate);

      return {
        id: `clinic-${index + 1}`,
        name,
        totalConversations: baseConversations,
        engaged,
        leads,
        bookings,
        conversionRate: (bookings / baseConversations) * 100,
        engagementRate: engagementRate * 100,
        leadRate: leadRate * 100
      };
    });
  },

  // Generate mock trend data
  getTrendData: (days = 30) => {
    const data = [];
    const baseDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);

      // Simulate realistic patterns with some randomness
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseMultiplier = isWeekend ? 0.7 : 1.0;

      data.push({
        date: date.toISOString(),
        bookings: Math.floor((Math.random() * 50 + 80) * baseMultiplier),
        leads: Math.floor((Math.random() * 200 + 300) * baseMultiplier),
        engaged: Math.floor((Math.random() * 150 + 180) * baseMultiplier),
        conversations: Math.floor((Math.random() * 300 + 400) * baseMultiplier)
      });
    }

    return data;
  },

  // Generate mock metrics summary
  getMetricsSummary: () => {
    return {
      totalBookings: 3104,
      totalLeads: 13910,
      engagedConversations: 7911,
      conversionRate: '15.5%',
      bookingsChange: '+12.5%',
      bookingsChangeType: 'increase',
      leadsChange: '+8.2%',
      leadsChangeType: 'increase',
      engagedChange: '+5.1%',
      engagedChangeType: 'increase',
      conversionChange: '+2.1%',
      conversionChangeType: 'increase'
    };
  }
};

// Utility function to determine if we should use mock data
export const shouldUseMockData = () => {
  return process.env.NODE_ENV === 'development' && window.location.search.includes('mock=true');
};

export default api;