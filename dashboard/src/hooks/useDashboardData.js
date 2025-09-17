import { useState, useEffect, useMemo } from 'react';

/**
 * Dashboard data hook that provides filtered clinic analytics
 * @param {Object} params - Filter parameters
 * @param {string} params.clinicId - Clinic ID ("all" or specific clinic name)
 * @param {string} params.periodId - Period ID ("2025-02_2025-09" for range or "2025-09" for single month)
 * @returns {Object} Dashboard data including totals, trends, clinics list, and top locations
 */
export function useDashboardData({ clinicId = "all", periodId = "2025-02_2025-09" }) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/monthly-clinic-data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMonthlyData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Memoized computed data based on filters
  const computedData = useMemo(() => {
    if (!monthlyData) {
      return {
        totals: { bookings: 0, leads: 0, engaged: 0 },
        trend: [],
        clinics: [],
        topLocations: [],
        isLoading,
        error
      };
    }

    // Determine data source based on period
    let dataSource;
    let isRangePeriod = periodId === "2025-02_2025-09" || periodId === "all";

    if (isRangePeriod) {
      dataSource = monthlyData.allTime;
    } else {
      dataSource = monthlyData.monthly[periodId];
    }

    // Get totals based on clinic filter
    let totals;
    if (clinicId === "all") {
      totals = dataSource?.totals || { bookings: 0, leads: 0, engaged: 0 };
    } else {
      const clinicData = dataSource?.clinics?.[clinicId];
      totals = clinicData ? {
        bookings: clinicData.bookings || 0,
        leads: clinicData.leads || 0,
        engaged: clinicData.engaged || 0
      } : { bookings: 0, leads: 0, engaged: 0 };
    }

    // Generate trend data from monthly breakdown
    const trend = monthlyData.months.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
      const monthData = monthlyData.monthly[monthKey];

      if (clinicId === "all") {
        return {
          month: monthName,
          bookings: monthData?.totals?.bookings || 0,
          leads: monthData?.totals?.leads || 0,
          engaged: monthData?.totals?.engaged || 0
        };
      } else {
        const clinicMonthData = monthData?.clinics?.[clinicId];
        return {
          month: monthName,
          bookings: clinicMonthData?.bookings || 0,
          leads: clinicMonthData?.leads || 0,
          engaged: clinicMonthData?.engaged || 0
        };
      }
    });

    // Generate clinics list
    const clinics = [
      { id: "all", name: "All Locations" },
      ...Object.keys(monthlyData.allTime.clinics).sort().map(name => ({
        id: name,
        name: name
      }))
    ];

    // Generate top performing locations
    const sourceForTop = isRangePeriod ? monthlyData.allTime : monthlyData.monthly[periodId];
    const topLocations = sourceForTop?.clinics ?
      Object.entries(sourceForTop.clinics)
        .map(([name, data]) => ({
          clinic: name,
          bookings: data.bookings || 0,
          leads: data.leads || 0,
          engaged: data.engaged || 0
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 4) : [];

    // Generate automation breakdown based on filters
    const automationBreakdown = {};
    if (sourceForTop?.clinics) {
      if (clinicId === "all") {
        // Aggregate all clinics' automation data
        Object.values(sourceForTop.clinics).forEach(clinicData => {
          if (clinicData.automations) {
            Object.entries(clinicData.automations).forEach(([code, data]) => {
              if (!automationBreakdown[code]) {
                automationBreakdown[code] = { bookings: 0, leads: 0, engaged: 0, conversations: 0 };
              }
              automationBreakdown[code].bookings += data.bookings || 0;
              automationBreakdown[code].leads += data.leads || 0;
              automationBreakdown[code].engaged += data.engaged || 0;
              automationBreakdown[code].conversations += data.conversations || 0;
            });
          }
        });
      } else {
        // Use specific clinic's automation data
        const clinicData = sourceForTop.clinics[clinicId];
        if (clinicData?.automations) {
          Object.entries(clinicData.automations).forEach(([code, data]) => {
            automationBreakdown[code] = {
              bookings: data.bookings || 0,
              leads: data.leads || 0,
              engaged: data.engaged || 0,
              conversations: data.conversations || 0
            };
          });
        }
      }
    }

    return {
      totals,
      trend,
      clinics,
      topLocations,
      automationBreakdown,
      isLoading: false,
      error: null
    };
  }, [monthlyData, clinicId, periodId, isLoading, error]);

  return computedData;
}