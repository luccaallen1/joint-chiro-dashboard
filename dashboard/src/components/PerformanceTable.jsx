import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, ExternalLink } from 'lucide-react';

const PerformanceTable = ({
  clinics = [],
  isLoading,
  onClinicSelect,
  selectedClinics = []
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'conversionRate', direction: 'desc' });

  const sortOptions = [
    { key: 'name', label: 'Clinic Name' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'leads', label: 'Leads' },
    { key: 'engaged', label: 'Engaged' },
    { key: 'conversionRate', label: 'Conversion Rate' },
    { key: 'totalConversations', label: 'Total Conversations' }
  ];

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedClinics = [...clinics].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ?
      <ArrowUp className="h-4 w-4 text-primary-600" /> :
      <ArrowDown className="h-4 w-4 text-primary-600" />;
  };

  const exportToCSV = () => {
    const headers = ['Clinic Name', 'Bookings', 'Leads', 'Engaged', 'Total Conversations', 'Conversion Rate'];
    const csvContent = [
      headers.join(','),
      ...sortedClinics.map(clinic =>
        [
          `"${clinic.name}"`,
          clinic.bookings || 0,
          clinic.leads || 0,
          clinic.engaged || 0,
          clinic.totalConversations || 0,
          `${(clinic.conversionRate || 0).toFixed(1)}%`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPerformanceIndicator = (rate) => {
    if (rate >= 20) return { color: 'text-success-600', bg: 'bg-success-100', label: 'Excellent' };
    if (rate >= 15) return { color: 'text-primary-600', bg: 'bg-primary-100', label: 'Good' };
    if (rate >= 10) return { color: 'text-warning-600', bg: 'bg-warning-100', label: 'Average' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Needs Attention' };
  };

  if (isLoading) {
    return (
      <div className="performance-table">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Clinic Performance</h3>
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-table">
      {/* Table Header */}
      <div className="p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
            Clinic Performance
          </h3>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              {sortOptions.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedClinics.map((clinic) => {
              const isSelected = selectedClinics.some(c => c.id === clinic.id);
              const performance = getPerformanceIndicator(clinic.conversionRate || 0);

              return (
                <tr
                  key={clinic.id}
                  className={`table-row ${isSelected ? 'bg-primary-50' : ''}`}
                  onClick={() => onClinicSelect(clinic)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {clinic.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {clinic.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{(clinic.bookings || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{(clinic.leads || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{(clinic.engaged || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(clinic.totalConversations || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{(clinic.conversionRate || 0).toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${performance.bg} ${performance.color}`}>
                      {performance.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClinicSelect(clinic);
                      }}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Summary */}
      {sortedClinics.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-600">
            <div>
              Showing {sortedClinics.length} clinic{sortedClinics.length !== 1 ? 's' : ''}
            </div>
            <div className="mt-2 sm:mt-0">
              Total: {sortedClinics.reduce((sum, c) => sum + (c.totalConversations || 0), 0).toLocaleString()} conversations,{' '}
              {sortedClinics.reduce((sum, c) => sum + (c.bookings || 0), 0).toLocaleString()} bookings
            </div>
          </div>
        </div>
      )}

      {sortedClinics.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No clinic data available</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceTable;