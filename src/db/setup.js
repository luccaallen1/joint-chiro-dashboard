const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
  try {
    console.log('🔨 Setting up database schema...');

    // Create tables in order
    const queries = [
      // Clients table
      `CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Locations table
      `CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id),
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Automations table
      `CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        first_seen TIMESTAMP,
        last_activity TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Conversations table
      `CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(255) UNIQUE,
        client_id UUID REFERENCES clients(id),
        location_id UUID REFERENCES locations(id),
        automation_id UUID REFERENCES automations(id),
        customer_id UUID REFERENCES customers(id),
        transcript TEXT,
        engaged BOOLEAN DEFAULT false,
        lead_created BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id),
        location_id UUID REFERENCES locations(id),
        automation_id UUID REFERENCES automations(id),
        customer_id UUID REFERENCES customers(id),
        conversation_id UUID REFERENCES conversations(id),
        date TIMESTAMP,
        status VARCHAR(50),
        revenue DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Import logs table
      `CREATE TABLE IF NOT EXISTS import_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        import_type VARCHAR(50),
        status VARCHAR(50),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        total_records_fetched INTEGER,
        total_records_processed INTEGER,
        records_created INTEGER,
        records_updated INTEGER,
        conversations_created INTEGER,
        bookings_created INTEGER,
        leads_created INTEGER,
        engaged_conversations INTEGER,
        clients_created INTEGER,
        locations_created INTEGER,
        customers_created INTEGER,
        customers_updated INTEGER,
        duration_seconds INTEGER,
        records_per_second DECIMAL(10,2),
        error_message TEXT,
        triggered_by VARCHAR(50),
        incremental BOOLEAN DEFAULT false,
        notes TEXT
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_conversations_location ON conversations(location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_location ON bookings(location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)`,
      `CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name)`
    ];

    for (const query of queries) {
      await pool.query(query);
    }

    console.log('✅ Database schema created successfully!');

    // Check if we have data
    const countCheck = await pool.query('SELECT COUNT(*) FROM conversations');
    console.log(`📊 Current conversations in database: ${countCheck.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;