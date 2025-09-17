const db = require('./db/connection');
const { runMigrations } = require('./migrate');
const { runSeeds } = require('./seed');

async function initialize() {
  try {
    console.log('🚀 Initializing JointChiro Data Dashboard...');

    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await db.testConnection();

    if (!connected) {
      throw new Error('Could not establish database connection');
    }

    console.log('✅ Database connection successful');
    console.log('📊 JointChiro Data Dashboard is ready!');
    console.log('');
    console.log('Available commands:');
    console.log('  npm run migrate - Run database migrations');
    console.log('  npm run seed    - Seed database with initial data');
    console.log('  npm run docker:up - Start PostgreSQL container');
    console.log('  npm run docker:down - Stop PostgreSQL container');
    console.log('');

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Initialize when this file is run directly
if (require.main === module) {
  initialize();
}

module.exports = { initialize };