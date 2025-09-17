# JointChiro Data Dashboard - Import System

## Overview

The JointChiro Data Dashboard includes a comprehensive core import system with automated scheduling for processing chiropractic clinic conversation data from Airtable.

## Features

### 🔄 **Automated Scheduling**
- **Schedule**: Every 12 hours at 6:00 AM and 6:00 PM
- **Initial Import**: Runs automatically on server startup
- **Manual Trigger**: Available via API endpoint
- **Incremental Updates**: Only fetches records modified since last import

### 🔒 **Idempotent Operations**
- Safe to run multiple times without duplicating data
- Uses `external_id` (Airtable record ID) for uniqueness
- PostgreSQL transactions ensure data consistency
- Automatic rollback on any errors

### 📊 **Expected Results**
After successful import, you should see:
- **20,077** total conversations
- **3,122** bookings (15.5% booking rate)
- **13,908** leads (69.3% lead rate)
- **7,910** engaged conversations (39.4% engagement rate)

## Quick Start

### 1. Setup Environment
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your AIRTABLE_API_KEY

# Start database
npm run docker:up
npm run migrate
npm run seed
```

### 2. Start the System
```bash
# Start server with automated scheduler
npm start

# The system will automatically:
# - Initialize the scheduler
# - Run initial import on startup
# - Schedule imports for 6:00 AM and 6:00 PM daily
```

### 3. Monitor Import Status
```bash
# Check system health and status
npm run health

# Get detailed import status
npm run status

# Trigger manual import (incremental)
npm run import:incremental

# Trigger manual full import
npm run import:manual
```

## API Endpoints

### **Import Management**

#### `POST /api/import/trigger`
Manually trigger an import
```json
{
  "incremental": true,
  "notes": "Manual import for testing"
}
```

#### `GET /api/import/status`
Get current import status and scheduler information
```json
{
  "status": {
    "isRunning": false,
    "currentImportId": null,
    "schedulerInitialized": true
  },
  "lastCompleted": {
    "completedAt": "2024-01-15T12:00:00Z",
    "totalProcessed": 20077,
    "stats": {
      "conversations": 20077,
      "bookings": 3122,
      "leads": 13908,
      "engaged": 7910
    }
  }
}
```

#### `GET /api/import/history`
Get last 10 import runs with detailed metrics

#### `GET /api/import/stats`
Get comprehensive statistics and validation against expected metrics

### **Scheduler Control**

#### `POST /api/import/scheduler/start`
Start the automated scheduler

#### `POST /api/import/scheduler/stop`
Stop the automated scheduler

### **System Health**

#### `GET /health`
System health check including database, scheduler, and data counts

## Data Processing

### **Client & Location Creation**
- Each "Clinic" field creates both a client and location record
- Currently 1:1 relationship, designed for future 1:many scaling
- All automation types are automatically linked to each location

### **Customer Management**
- Creates/updates customers using "User ID" as `external_id`
- Idempotent operations prevent duplicates
- Updates existing customers with latest information

### **Conversation Processing**
- Creates conversations with proper foreign key relationships
- Links to client, location, automation, and customer
- Tracks engagement and lead creation status

### **Booking Creation**
- Creates bookings when Booking field contains "2025"
- Supports multiple date formats
- Links to conversation for traceability

### **Lead Generation**
- Creates leads when "Lead Created" = "Yes"
- Tracks source as 'chatbot'
- Links to originating conversation

## Monitoring & Logging

### **Import Logs Table**
All imports are tracked in the `import_logs` table with:
- Detailed statistics (processed, created, updated, errors)
- Performance metrics (duration, records/second)
- Trigger source (scheduler, manual, startup)
- Error tracking and recovery information

### **File Logging**
- `logs/combined.log` - All application logs
- `logs/import.log` - Import-specific logs
- `logs/import-detailed.log` - Detailed import processing
- `logs/scheduler.log` - Scheduler activity
- `logs/error.log` - Error logs only

### **Real-time Monitoring**
Use the API endpoints to monitor:
```bash
# Watch import status
watch -n 5 'curl -s http://localhost:3000/api/import/status | jq .status'

# Monitor system health
watch -n 10 'curl -s http://localhost:3000/health | jq'

# View recent import history
curl http://localhost:3000/api/import/history | jq '.imports[0]'
```

## Scheduling Details

### **Cron Schedule**
```javascript
// Morning import: 6:00 AM daily
'0 6 * * *'

// Evening import: 6:00 PM daily
'0 18 * * *'
```

### **Import Types**
1. **Startup Import**: Runs when server starts
   - Full import if no data exists
   - Incremental if existing data found

2. **Scheduled Imports**: Every 12 hours
   - Always incremental after initial load
   - Only processes records modified since last successful import

3. **Manual Imports**: Via API trigger
   - Can be full or incremental
   - Useful for testing and recovery

## Error Handling & Recovery

### **Transaction Safety**
- Each batch processed in PostgreSQL transaction
- Automatic rollback on any error within batch
- Import continues with next batch if one fails

### **Connection Resilience**
- Automatic retry with exponential backoff
- Rate limiting to avoid API limits
- Graceful handling of network issues

### **Data Validation**
- Real-time validation against expected metrics
- Automatic flagging of data inconsistencies
- Detailed error logging for troubleshooting

## Performance

### **Batch Processing**
- 100 records per batch (optimized for Airtable limits)
- ~40-50 records/second processing rate
- Memory efficient (doesn't load all data at once)

### **Incremental Efficiency**
- Only processes changed records after initial load
- Dramatically reduced processing time for regular updates
- Maintains data freshness without full re-import overhead

### **Database Optimization**
- Proper indexes on all foreign keys and external_id fields
- Connection pooling for database efficiency
- Optimized queries for lookup operations

## Troubleshooting

### **Import Failures**
```bash
# Check recent import logs
curl http://localhost:3000/api/import/history | jq '.imports[0].errors'

# View detailed logs
tail -f logs/import-detailed.log

# Check scheduler status
curl http://localhost:3000/api/import/status | jq '.scheduler'
```

### **Data Validation Issues**
```bash
# Check current stats vs expected
curl http://localhost:3000/api/import/stats | jq '.validation'

# Test data processor rules
curl http://localhost:3000/api/test/data-processor
```

### **Connection Problems**
```bash
# Test connections
curl http://localhost:3000/api/test/airtable-connection

# Check database connection
curl http://localhost:3000/health | jq '.database'
```

## Scripts Reference

```bash
# Core Operations
npm start              # Start server with scheduler
npm run dev            # Development mode with auto-reload

# Database Management
npm run docker:up      # Start PostgreSQL container
npm run migrate        # Run database migrations
npm run seed          # Seed initial automation data

# Import Operations
npm run import:manual      # Trigger full manual import
npm run import:incremental # Trigger incremental import
npm run status            # Check import status
npm run health            # System health check

# Testing
npm run test:airtable     # Test Airtable connection

# Docker Management
npm run docker:down       # Stop PostgreSQL
npm run docker:logs       # View PostgreSQL logs
```

## Architecture

```
src/
├── services/
│   ├── importService.js     # Core import logic with idempotent operations
│   ├── scheduler.js         # Automated scheduling with node-cron
│   ├── airtable.service.js  # Airtable API integration
│   ├── dataProcessor.js     # Data transformation rules
│   └── batchProcessor.js    # Legacy batch processor
├── routes/
│   ├── import.js           # Import API endpoints
│   └── test.js             # Testing endpoints
├── utils/
│   └── logger.js           # Structured logging system
└── server.js               # Main application with scheduler startup
```

The system is designed for production use with comprehensive error handling, monitoring, and recovery capabilities while maintaining data integrity through idempotent operations and transaction safety.