import { useState } from 'react';
import { RefreshCw, Calendar, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';

const Header = ({
  dateRange,
  onDateRangeChange,
  onRefresh,
  lastUpdated,
  isLoading
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateRangeChange = (range) => {
    const endDate = new Date();
    let startDate;

    switch (range) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    onDateRangeChange({ start: startDate, end: endDate });
    setShowDatePicker(false);
  };

  return (
    <div className="bg-white shadow-card border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
          {/* Logo and Title */}
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  JointChiro.Data.Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Chiropractic Clinic Analytics & Performance
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
              </button>

              {/* Date Range Dropdown */}
              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleDateRangeChange('7d')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('30d')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('90d')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Last 90 days
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;