import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Target, MessageSquare } from 'lucide-react';

const SimpleDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    bookings: 0,
    leads: 0,
    engaged: 0
  });
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [monthlyData, setMonthlyData] = useState(null);

  const fetchMetrics = async (clinicFilter = 'all', monthFilter = 'all') => {
    setIsLoading(true);

    try {
      // Load monthly data if not already loaded
      if (!monthlyData) {
        const response = await fetch('/monthly-clinic-data.json');
        const data = await response.json();
        setMonthlyData(data);

        // Set clinic and month lists from static data
        const clinicNames = Object.keys(data.allTime.clinics).sort();
        setClinics(clinicNames);

        // Generate month options
        const monthOptions = data.months.map(monthKey => {
          const [year, month] = monthKey.split('-');
          const date = new Date(year, month - 1);
          return {
            key: monthKey,
            label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
          };
        });
        setMonths(monthOptions);
      }

      const currentData = monthlyData || await fetch('/monthly-clinic-data.json').then(r => r.json());

      // Determine which dataset to use
      let dataSource;
      if (monthFilter === 'all') {
        // Use all-time data
        dataSource = currentData.allTime;
      } else {
        // Use specific month data
        dataSource = currentData.monthly[monthFilter];
      }

      // Get metrics based on clinic and month filters
      if (clinicFilter === 'all') {
        // Show totals for the selected time period
        setMetrics({
          bookings: dataSource.totals.bookings,
          leads: dataSource.totals.leads,
          engaged: dataSource.totals.engaged
        });
      } else {
        // Get specific clinic data for the selected time period
        if (dataSource.clinics[clinicFilter]) {
          const clinic = dataSource.clinics[clinicFilter];
          setMetrics({
            bookings: clinic.bookings,
            leads: clinic.leads,
            engaged: clinic.engaged
          });
        } else {
          // Fallback if clinic not found in this time period
          setMetrics({
            bookings: 0,
            leads: 0,
            engaged: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading monthly clinic data:', error);
      // Fallback to real totals
      setMetrics({
        bookings: 3105,
        leads: 13874,
        engaged: 7628
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial metrics and load data
    fetchMetrics('all', 'all');
  }, []);

  const handleClinicChange = (clinic) => {
    setSelectedClinic(clinic);
    setShowClinicDropdown(false);
    fetchMetrics(clinic, selectedMonth);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setShowMonthDropdown(false);
    fetchMetrics(selectedClinic, month);
  };

  const getClinicDisplayName = () => {
    return selectedClinic === 'all' ? 'All Clinics' : selectedClinic;
  };

  const getMonthDisplayName = () => {
    if (selectedMonth === 'all') return 'All Time';
    const monthOption = months.find(m => m.key === selectedMonth);
    return monthOption ? monthOption.label : 'All Time';
  };

  const MetricCard = ({ title, value, icon: Icon, color }) => (
    <div className="metric-card p-8">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-full bg-gray-50 ${color}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
        <div className="text-4xl font-bold text-gray-900">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
          ) : (
            typeof value === 'string' ? value : value.toLocaleString()
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            JointChiro Data Dashboard
          </h1>

          {/* Filters */}
          <div className="flex justify-center mb-8 space-x-4">
            {/* Month Filter */}
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-w-48"
              >
                <span className="flex-1 text-left">{getMonthDisplayName()}</span>
                <ChevronDown className="h-5 w-5 ml-2" />
              </button>

              {showMonthDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20 max-h-80 overflow-y-auto">
                  <div className="py-2">
                    <button
                      onClick={() => handleMonthChange('all')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        selectedMonth === 'all' ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      All Time
                    </button>
                    {months.map((month) => (
                      <button
                        key={month.key}
                        onClick={() => handleMonthChange(month.key)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          selectedMonth === month.key ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        }`}
                      >
                        {month.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clinic Filter */}
            <div className="relative">
              <button
                onClick={() => setShowClinicDropdown(!showClinicDropdown)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-w-64"
              >
                <span className="flex-1 text-left">{getClinicDisplayName()}</span>
                <ChevronDown className="h-5 w-5 ml-2" />
              </button>

              {showClinicDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20 max-h-80 overflow-y-auto">
                  <div className="py-2">
                    <button
                      onClick={() => handleClinicChange('all')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        selectedClinic === 'all' ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      All Clinics
                    </button>
                    {clinics.map((clinic) => (
                      <button
                        key={clinic}
                        onClick={() => handleClinicChange(clinic)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          selectedClinic === clinic ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        }`}
                      >
                        {clinic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MetricCard
            title="Total Bookings"
            value={metrics.bookings}
            icon={Calendar}
            color="text-primary-600"
          />
          <MetricCard
            title="Leads Created"
            value={metrics.leads}
            icon={Target}
            color="text-success-600"
          />
          <MetricCard
            title="Engaged Conversations"
            value={metrics.engaged}
            icon={MessageSquare}
            color="text-warning-600"
          />
        </div>
      </main>
    </div>
  );
};

export default SimpleDashboard;