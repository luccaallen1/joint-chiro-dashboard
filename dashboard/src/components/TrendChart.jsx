import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';

const TrendChart = ({ data = [], isLoading, selectedClinics = [] }) => {
  const [timeView, setTimeView] = useState('daily'); // daily, weekly, monthly
  const [activeMetrics, setActiveMetrics] = useState(['bookings', 'leads', 'engaged']);

  const timeViewOptions = [
    { value: 'daily', label: 'Daily', icon: Calendar },
    { value: 'weekly', label: 'Weekly', icon: BarChart3 },
    { value: 'monthly', label: 'Monthly', icon: TrendingUp }
  ];

  const metricOptions = [
    { key: 'bookings', label: 'Bookings', color: '#0369a1' },
    { key: 'leads', label: 'Leads', color: '#16a34a' },
    { key: 'engaged', label: 'Engaged', color: '#f59e0b' }
  ];

  const toggleMetric = (metric) => {
    setActiveMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    switch (timeView) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short' });
      default:
        return tickItem;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="chart-container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Performance Trends
            {selectedClinics.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({selectedClinics.length} clinic{selectedClinics.length !== 1 ? 's' : ''} selected)
              </span>
            )}
          </h3>
        </div>

        {/* Time View Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {timeViewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTimeView(option.value)}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeView === option.value
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Toggles */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metricOptions.map((metric) => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeMetrics.includes(metric.key)
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: activeMetrics.includes(metric.key) ? metric.color : undefined
            }}
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {activeMetrics.includes('bookings') && (
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#0369a1"
                strokeWidth={2}
                dot={{ fill: '#0369a1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#0369a1', strokeWidth: 2 }}
                name="Bookings"
              />
            )}

            {activeMetrics.includes('leads') && (
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                name="Leads"
              />
            )}

            {activeMetrics.includes('engaged') && (
              <Line
                type="monotone"
                dataKey="engaged"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                name="Engaged"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Summary */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {metricOptions.map((metric) => {
              const total = data.reduce((sum, item) => sum + (item[metric.key] || 0), 0);
              const average = Math.round(total / data.length);

              return (
                <div key={metric.key} className="flex items-center justify-between">
                  <span className="text-gray-600">{metric.label} (avg/day):</span>
                  <span className="font-medium" style={{ color: metric.color }}>
                    {average.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;