import React, { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

export default function DatabaseViewer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Database tables info
  const tableDescriptions = {
    clients: 'Chiropractic clinics using the chatbot platform',
    locations: 'Physical clinic locations',
    customers: 'Patients chatting with bots',
    automations: 'Bot types (WB/IB/CB/DB/EB/TB/WEB)',
    location_automations: 'Junction table linking locations to active automations',
    conversations: 'Chat conversations between customers and bots',
    bookings: 'Appointment bookings made through the chatbot',
    leads: 'Potential customers generated through conversations',
    import_logs: 'Logs of data import operations'
  };

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setConnectionStatus('connected');
        await fetchTables();
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Database server not running. Start with: npm run docker:up');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      } else {
        throw new Error('Failed to fetch tables');
      }
    } catch (err) {
      setError('Failed to fetch database tables');
    }
  };

  const fetchTableData = async (tableName) => {
    if (!tableName) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);
      if (response.ok) {
        const data = await response.json();
        setTableData(data.rows || []);
      } else {
        throw new Error(`Failed to fetch data for ${tableName}`);
      }
    } catch (err) {
      setError(`Error loading ${tableName} data: ${err.message}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const getColumns = () => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_500px_at_50%_-50%,rgba(59,130,246,0.15),transparent_60%),linear-gradient(to_bottom_right,#020617,40%,#0b1220)] px-6 py-6 lg:px-12 xl:px-16 2xl:px-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl flex items-center gap-3">
              <Database className="h-8 w-8 text-cyan-400" />
              Database Viewer
            </h1>
            <p className="mt-1 text-sm text-white/60">View and explore the Joint Chiro database tables</p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              connectionStatus === 'disconnected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {connectionStatus === 'connected' ? <CheckCircle className="h-3 w-3" /> :
               connectionStatus === 'disconnected' ? <X className="h-3 w-3" /> :
               <RefreshCw className="h-3 w-3 animate-spin" />}
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'disconnected' ? 'Disconnected' :
               'Checking...'}
            </div>

            <button
              onClick={checkConnection}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Database Not Available</span>
          </div>
          <p className="text-sm text-red-300/80 mb-3">
            The PostgreSQL database is not running. To start it:
          </p>
          <code className="block p-2 rounded bg-red-900/20 text-red-300 text-sm font-mono">
            cd /Users/luccaallen/JointChiro.Data.Dashboard && npm run docker:up
          </code>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <>
          {/* Table Selection */}
          <div className="mb-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-6">
              <h2 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
                <Table className="h-5 w-5 text-cyan-400" />
                Database Tables
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(tableDescriptions).map(([tableName, description]) => (
                  <button
                    key={tableName}
                    onClick={() => setSelectedTable(tableName)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedTable === tableName
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium mb-1">{tableName}</div>
                    <div className="text-xs opacity-70">{description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Data */}
          {selectedTable && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/20">
              <div className="border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white/90">{selectedTable}</h2>
                    <p className="text-sm text-white/60">{tableDescriptions[selectedTable]}</p>
                  </div>
                  <div className="text-sm text-white/60">
                    {tableData.length} rows
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
                  <p className="text-white/60">Loading {selectedTable} data...</p>
                </div>
              ) : tableData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {getColumns().map(column => (
                          <th key={column} className="text-left px-6 py-3 text-xs font-medium text-white/70 uppercase tracking-wider">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tableData.map((row, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          {getColumns().map(column => (
                            <td key={column} className="px-6 py-4 text-sm text-white/80">
                              {row[column] !== null && row[column] !== undefined ? String(row[column]) : (
                                <span className="text-white/40 italic">null</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !loading && selectedTable && (
                <div className="p-12 text-center">
                  <Table className="h-8 w-8 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">No data in {selectedTable} table</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}