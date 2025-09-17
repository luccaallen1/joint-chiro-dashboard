// Simple API endpoints for database access
// This would normally be in a separate backend, but for demo purposes
// we'll create a mock API that can be replaced with real backend calls

const API_BASE_URL = 'http://localhost:3000/api';

export const databaseAPI = {
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async getTables() {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      return await response.json();
    } catch (error) {
      throw new Error('Database not available');
    }
  },

  async getTableData(tableName) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);
      if (!response.ok) throw new Error(`Failed to fetch ${tableName} data`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to load ${tableName} data`);
    }
  }
};

// Mock data for when database is not available
export const mockTableData = {
  clients: [
    { id: 1, name: 'Joint Chiro - Gadsden', created_at: '2024-01-15T10:00:00Z', status: 'active' },
    { id: 2, name: 'Joint Chiro - Capitol Hill', created_at: '2024-01-16T10:00:00Z', status: 'active' },
    { id: 3, name: 'Joint Chiro - Copperfield', created_at: '2024-01-17T10:00:00Z', status: 'paused' }
  ],
  locations: [
    { id: 1, client_id: 1, name: 'Gadsden', address: '123 Main St', city: 'Gadsden', state: 'AL' },
    { id: 2, client_id: 2, name: 'Capitol Hill', address: '456 Capitol Ave', city: 'Seattle', state: 'WA' },
    { id: 3, client_id: 3, name: 'Copperfield', address: '789 Copper Rd', city: 'Houston', state: 'TX' }
  ],
  automations: [
    { id: 1, code: 'WB', name: 'Web Bot', description: 'Main website chatbot' },
    { id: 2, code: 'IB', name: 'Intake Bot', description: 'Patient intake automation' },
    { id: 3, code: 'CB', name: 'Comment Bot', description: 'Social media response automation' }
  ]
};