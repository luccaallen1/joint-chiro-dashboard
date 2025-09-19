import { useState, useEffect } from 'react';

/**
 * Dashboard data hook that fetches real data from the API
 * @param {Object} params - Filter parameters
 * @param {string} params.clinicId - Clinic ID ("all" or specific clinic name)
 * @param {string} params.periodId - Period ID
 * @returns {Object} Dashboard data from real database
 */
export function useDashboardData({ clinicId = "all", periodId = "all" }) {
  const [dashboardData, setDashboardData] = useState({
    totals: {
      conversations: 0,
      bookings: 0,
      leads: 0,
      engaged: 0
    },
    trend: [],
    topLocations: [],
    automationBreakdown: {},
    clinics: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));

        // Build query parameters
        const params = new URLSearchParams();
        if (clinicId && clinicId !== 'all') {
          params.append('clinic', clinicId);
        }

        // Convert period to month number
        if (periodId && periodId !== 'all') {
          let monthNum = periodId;

          // Handle different period formats
          if (periodId.includes('2025-')) {
            // Extract month from formats like "2025-02_2025-09" or "2025-02"
            if (periodId.includes('_')) {
              // Range format - use first month for now
              monthNum = periodId.split('_')[0].split('-')[1];
            } else {
              // Single month format
              monthNum = periodId.split('-')[1];
            }
          } else if (periodId.length <= 2) {
            // Already a month number
            monthNum = periodId.padStart(2, '0');
          }

          params.append('period', monthNum);
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const url = `${API_URL}/api/simple-metrics/dashboard${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const data = await response.json();
        setDashboardData({
          ...data,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    };

    fetchDashboardData();
  }, [clinicId, periodId]);

  return dashboardData;
}