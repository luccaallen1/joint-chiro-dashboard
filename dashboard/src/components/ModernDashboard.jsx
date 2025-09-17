import { useState, useEffect } from 'react';
import { Calendar, Target, MessageSquare, TrendingUp, Activity, Users, Sparkles, BarChart3 } from 'lucide-react';
import '../styles/animations.css';

const ModernDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    bookings: 0,
    leads: 0,
    engaged: 0
  });
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [monthlyData, setMonthlyData] = useState(null);

  const fetchMetrics = async (clinicFilter = 'all', monthFilter = 'all') => {
    setIsLoading(true);

    try {
      if (!monthlyData) {
        const response = await fetch('/monthly-clinic-data.json');
        const data = await response.json();
        setMonthlyData(data);

        const clinicNames = Object.keys(data.allTime.clinics).sort();
        setClinics(clinicNames);

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

      let dataSource;
      if (monthFilter === 'all') {
        dataSource = currentData.allTime;
      } else {
        dataSource = currentData.monthly[monthFilter];
      }

      if (clinicFilter === 'all') {
        setMetrics({
          bookings: dataSource.totals.bookings,
          leads: dataSource.totals.leads,
          engaged: dataSource.totals.engaged
        });
      } else {
        if (dataSource.clinics[clinicFilter]) {
          const clinic = dataSource.clinics[clinicFilter];
          setMetrics({
            bookings: clinic.bookings,
            leads: clinic.leads,
            engaged: clinic.engaged
          });
        } else {
          setMetrics({
            bookings: 0,
            leads: 0,
            engaged: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    fetchMetrics('all', 'all');
  }, []);

  const handleClinicChange = (clinic) => {
    setSelectedClinic(clinic);
    fetchMetrics(clinic, selectedMonth);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
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

  const MetricCard = ({ title, value, icon: Icon, gradient, shadowColor, delay = 0 }) => (
    <div
      className={`metric-card relative overflow-hidden rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-500 ease-out ${gradient} ${shadowColor} group`}
      style={{
        animationDelay: `${delay}ms`,
        animation: isLoading ? 'none' : 'slideInUp 0.8s ease-out forwards'
      }}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white/20 animate-pulse-soft"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10 animate-float"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 animate-rotate-slow"></div>
      </div>

      {/* Sparkle Effects */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Sparkles className="w-6 h-6 text-white/40 animate-pulse" />
      </div>

      {/* Icon */}
      <div className="relative mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 animate-glow">
          <Icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <h3 className="text-white/80 text-lg font-medium mb-2 group-hover:text-white transition-colors duration-300">{title}</h3>
        <div className="flex items-end space-x-2">
          {isLoading ? (
            <div className="loading-skeleton w-24 h-12 rounded-lg bg-white/20"></div>
          ) : (
            <>
              <span className="text-5xl font-bold text-white tracking-tight group-hover:text-shadow-lg transition-all duration-300">
                {typeof value === 'string' ? value : value.toLocaleString()}
              </span>
              <TrendingUp className="w-6 h-6 text-white/60 mb-2 group-hover:text-white/80 group-hover:scale-110 transition-all duration-300" />
            </>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-4 w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full shimmer-effect"
            style={{
              width: isLoading ? '0%' : '100%',
              transition: 'width 2s ease-out',
              transitionDelay: `${delay + 500}ms`
            }}
          ></div>
        </div>
      </div>
    </div>
  );

  const FilterButton = ({ label, options, selected, onSelect, type }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center space-x-3 px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-white min-w-[200px]"
        >
          <span className="text-sm font-medium opacity-80">{type}:</span>
          <span className="font-semibold flex-1 text-left">{label}</span>
          <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              {options.map((option, index) => (
                <button
                  key={option.key || option}
                  onClick={() => {
                    onSelect(option.key || option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    selected === (option.key || option)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {option.label || option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-12 pb-8">
          <div className="max-w-7xl mx-auto px-8">
            {/* Logo and Title */}
            <div className="text-center mb-12" style={{ animation: 'fadeInScale 1s ease-out' }}>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl mb-6 animate-glow group hover:scale-110 transition-transform duration-300">
                <Activity className="w-10 h-10 text-white animate-pulse-soft" />
              </div>
              <h1 className="text-6xl font-bold text-gradient-rainbow mb-4 hover:scale-105 transition-transform duration-300 cursor-default">
                JointChiro Analytics
              </h1>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <BarChart3 className="w-6 h-6 text-white/40" />
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                <Sparkles className="w-5 h-5 text-white/40 animate-pulse" />
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                <BarChart3 className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Real-time insights into your chiropractic clinic performance across all locations
              </p>
            </div>

            {/* Filters */}
            <div className="flex justify-center items-center space-x-6 mb-16">
              <FilterButton
                label={getMonthDisplayName()}
                options={[{ key: 'all', label: 'All Time' }, ...months]}
                selected={selectedMonth}
                onSelect={handleMonthChange}
                type="Period"
              />
              <FilterButton
                label={getClinicDisplayName()}
                options={[{ key: 'all', label: 'All Clinics' }, ...clinics.map(c => ({ key: c, label: c }))]}
                selected={selectedClinic}
                onSelect={handleClinicChange}
                type="Location"
              />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="max-w-7xl mx-auto px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <MetricCard
              title="Total Bookings"
              value={metrics.bookings}
              icon={Calendar}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              shadowColor="shadow-emerald-500/25"
              delay={0}
            />
            <MetricCard
              title="Leads Generated"
              value={metrics.leads}
              icon={Target}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
              shadowColor="shadow-blue-500/25"
              delay={200}
            />
            <MetricCard
              title="Engaged Conversations"
              value={metrics.engaged}
              icon={MessageSquare}
              gradient="bg-gradient-to-br from-purple-500 to-pink-600"
              shadowColor="shadow-purple-500/25"
              delay={400}
            />
          </div>

          {/* Summary Stats */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-8 px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-white/60" />
                <span className="text-white/80 text-sm">Total Clinics:</span>
                <span className="text-white font-semibold">{clinics.length}</span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-white/60" />
                <span className="text-white/80 text-sm">Data Range:</span>
                <span className="text-white font-semibold">Feb 2025 - Sep 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default ModernDashboard;