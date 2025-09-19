import React, { useState, useEffect } from 'react';
import { ChevronDown, Database, Table, Search, RefreshCw } from 'lucide-react';

const DatabaseViewer = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const tables = ['conversations', 'bookings', 'leads', 'clients', 'locations', 'automations'];
      setTables(tables);
      if (tables.length > 0 && !selectedTable) {
        setSelectedTable(tables[0]);
      }
    } catch (err) {
      setError('Failed to fetch tables');
    }
  };

  const fetchTableData = async (tableName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/database/${tableName}?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setTableData(data);
    } catch (err) {
      setError(`Failed to fetch data from ${tableName}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, limit]);

  const filteredData = tableData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Database Viewer
                </h1>
              </div>
              <button
                onClick={() => fetchTableData(selectedTable)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Table Selector */}
              <div className="lg:w-1/4">
                <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Tables
                </h2>
                <div className="space-y-2">
                  {tables.map(table => (
                    <button
                      key={table}
                      onClick={() => setSelectedTable(table)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                        selectedTable === table
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Table className="h-4 w-4" />
                      <span className="capitalize">{table}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Display */}
              <div className="lg:w-3/4">
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search in table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={10}>10 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                    <option value={500}>500 rows</option>
                    <option value={1000}>1000 rows</option>
                  </select>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {filteredData[0] && Object.keys(filteredData[0]).map(key => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            {Object.values(row).map((value, i) => (
                              <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                {value === null ? (
                                  <span className="text-gray-400 italic">null</span>
                                ) : typeof value === 'boolean' ? (
                                  <span className={`px-2 py-1 text-xs rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {value ? 'true' : 'false'}
                                  </span>
                                ) : (
                                  String(value).substring(0, 100)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredData.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No data found
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredData.length} of {tableData.length} rows
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;