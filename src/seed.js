const fs = require('fs');
const path = require('path');
const db = require('./db/connection');

async function runSeeds() {
  try {
    console.log('Starting database seeding...');

    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }

    // Read all seed files
    const seedsDir = path.join(__dirname, '..', 'seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${seedFiles.length} seed files`);

    // Execute each seed file
    for (const file of seedFiles) {
      console.log(`Running seed: ${file}`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await db.query(sql);
      console.log(`✓ Completed seed: ${file}`);
    }

    console.log('All seeds completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { runSeeds };