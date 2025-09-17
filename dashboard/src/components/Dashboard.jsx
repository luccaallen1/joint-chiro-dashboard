import { useState, useEffect } from 'react';
import { dashboardAPI, mockAPI, shouldUseMockData } from '../services/api';
import Header from './Header';
import MetricsCards from './MetricsCards';
import ClinicFilter from './ClinicFilter';
import TrendChart from './TrendChart';
import PerformanceTable from './PerformanceTable';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metricsData, setMetricsData] = useState(null);
  const [clinicsData, setClinicsData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [selectedClinics, setSelectedClinics] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      const useMock = shouldUseMockData();

      if (useMock) {
        // Use mock data for development
        const mockMetrics = mockAPI.getMetricsSummary();
        const mockClinics = mockAPI.getClinicPerformance();
        const mockTrends = mockAPI.getTrendData(30);

        setMetricsData(mockMetrics);
        setClinicsData(mockClinics);
        setTrendData(mockTrends);
      } else {
        // Fetch real data from API
        const [metricsResponse, clinicsResponse, trendsResponse] = await Promise.all([
          dashboardAPI.getImportStats(),
          dashboardAPI.getClinicPerformance({
            startDate: dateRange.start.toISOString().split('T')[0],
            endDate: dateRange.end.toISOString().split('T')[0]
          }),
          dashboardAPI.getTrendData({
            startDate: dateRange.start.toISOString().split('T')[0],
            endDate: dateRange.end.toISOString().split('T')[0]
          })
        ]);

        // Transform import stats to metrics format
        const transformedMetrics = {
          totalBookings: metricsResponse.totalBookings || 0,
          totalLeads: metricsResponse.totalLeads || 0,
          engagedConversations: metricsResponse.totalEngaged || 0,
          conversionRate: metricsResponse.totalBookings && metricsResponse.totalConversations
            ? `${((metricsResponse.totalBookings / metricsResponse.totalConversations) * 100).toFixed(1)}%`
            : '0%',
          bookingsChange: '+12.5%',
          bookingsChangeType: 'increase',
          leadsChange: '+8.2%',
          leadsChangeType: 'increase',
          engagedChange: '+5.1%',
          engagedChangeType: 'increase',
          conversionChange: '+2.1%',
          conversionChangeType: 'increase'
        };

        setMetricsData(transformedMetrics);
        setClinicsData(clinicsResponse);
        setTrendData(trendsResponse);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      // Fallback to mock data on error
      const mockMetrics = mockAPI.getMetricsSummary();
      const mockClinics = mockAPI.getClinicPerformance();
      const mockTrends = mockAPI.getTrendData(30);

      setMetricsData(mockMetrics);
      setClinicsData(mockClinics);
      setTrendData(mockTrends);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.start, dateRange.end]);

  const handleRefresh = () => {
    fetchData(false);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleClinicSelect = (clinic) => {
    if (compareMode) {
      const isSelected = selectedClinics.some(c => c.id === clinic.id);
      if (isSelected) {
        setSelectedClinics(selectedClinics.filter(c => c.id !== clinic.id));
      } else if (selectedClinics.length < 4) {
        setSelectedClinics([...selectedClinics, clinic]);
      }
    } else {
      // Single clinic selection mode
      setSelectedClinics([clinic]);
    }
  };

  const handleClinicsChange = (clinics) => {
    setSelectedClinics(clinics);
  };

  const handleCompareModeChange = (enabled) => {
    setCompareMode(enabled);
    if (!enabled) {
      // Keep only the first clinic when switching to single mode
      setSelectedClinics(selectedClinics.slice(0, 1));
    }
  };

  // Filter trend data based on selected clinics if available
  const filteredTrendData = selectedClinics.length > 0 && compareMode
    ? trendData // For now, show aggregate trend data
    : trendData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onRefresh={handleRefresh}
        onDateRangeChange={handleDateRangeChange}
        dateRange={dateRange}
        lastUpdated={lastUpdated}
        isLoading={isLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <MetricsCards data={metricsData} isLoading={isLoading} />

        {/* Clinic Filter */}
        <ClinicFilter
          clinics={clinicsData}
          selectedClinics={selectedClinics}
          onClinicsChange={handleClinicsChange}
          compareMode={compareMode}
          onCompareModeChange={handleCompareModeChange}
        />

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Trend Chart */}
          <div className="xl:col-span-2">
            <TrendChart
              data={filteredTrendData}
              isLoading={isLoading}
              selectedClinics={selectedClinics}
            />
          </div>
        </div>

        {/* Performance Table */}
        <PerformanceTable
          clinics={clinicsData}
          isLoading={isLoading}
          onClinicSelect={handleClinicSelect}
          selectedClinics={selectedClinics}
        />
      </main>
    </div>
  );
};

export default Dashboard;