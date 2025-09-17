# Airtable Integration Guide

## Overview

The JointChiro Data Dashboard includes comprehensive Airtable API integration to import chiropractic clinic conversation data with exact data processing rules for accurate metrics.

## Configuration

### 1. Environment Setup

Copy the example environment file and configure your Airtable API key:

```bash
cp .env.example .env
```

Edit `.env` and set your Airtable API key:

```env
# The Base ID and Table ID are pre-configured for JointChiro
AIRTABLE_BASE_ID=appXMUVedHv7xKRUx
AIRTABLE_TABLE_ID=tblUhKZE7sWzmHfiq

# You need to provide your API key
AIRTABLE_API_KEY=your_actual_api_key_here
```

## Data Processing Rules

### CRITICAL Processing Rules (Must be EXACT)

The system implements exact data processing rules to ensure accurate metrics:

1. **Booking Detection**: `booking_exists = true` when the Booking column contains the string "2025"
   - Expected result: exactly **3,122 bookings**

2. **Lead Creation**: `lead_created = true` when "Lead Created" field equals exactly "Yes"
   - Expected result: exactly **13,908 leads**

3. **Engagement**: `engaged = true` when "Engaged in conversation" equals "TRUE", "True", or "true"
   - Expected result: exactly **7,910 engaged conversations**

### Data Cleaning Rules

1. **UTM Parameter Removal**: Automation codes like "WEB?UTM_MEDIUM=ANDY" become "WEB"
2. **Automation Mapping**: "WEB" is mapped to "WB" for consistency
3. **Default Automation**: Null/missing automation codes default to "DB"
4. **Date Parsing**: Supports multiple formats:
   - `"Thu Oct 02 2025 18:30:00 GMT+0300"`
   - `"2025-09-15T10:00"`
   - Airtable Date objects

## Usage

### 1. Test Connection

First, test your Airtable connection:

```bash
# Start the test server
npm run server:dev

# In another terminal, test the connection
npm run test:airtable
# or visit: http://localhost:3000/api/test/airtable-connection
```

### 2. Run Full Import

Import all 20,077 records from Airtable:

```bash
npm run import
```

The import process will:
- Validate environment variables
- Show expected metrics
- Ask for confirmation
- Process records in batches of 100
- Show progress: "Processing X of 20,077 records..."
- Validate final metrics against expected values

### 3. Monitor Progress

The import script provides detailed progress logging:

```
🚀 Starting batch processing of Airtable data...
Expected total records: 20077

📦 Processing batch 1 (100 records)
   Progress: 100 of 20077 records fetched (0.5%)
   ✓ Batch 1 processed: 100 records
   📊 Total processed: 100 | Rate: 45.2 records/sec
   📈 Running totals - Bookings: 15 | Leads: 69 | Engaged: 39
```

## API Endpoints

### Test Endpoints

- `GET /api/test/airtable-connection` - Test Airtable connection and show sample data
- `GET /api/test/data-processor` - Test data processing rules with sample scenarios
- `GET /api/test/db-stats` - Get database statistics after import

### Health Check

- `GET /health` - Check system status

## File Structure

```
src/
├── services/
│   ├── airtable.service.js    # Airtable API connection and data fetching
│   ├── dataProcessor.js       # Data transformation with exact rules
│   └── batchProcessor.js      # Batch processing for 20,077 records
├── routes/
│   └── test.js               # Test endpoints
├── import.js                 # Main import script
└── server.js                # Express API server
```

## Expected Results

After successful import, you should see:

```
🎉 IMPORT COMPLETED SUCCESSFULLY!
================================
⏱️  Total time: 45.2s
📊 Records processed: 20077

📋 VALIDATION RESULTS:
Bookings: 3122/3122 ✅
Leads: 13908/13908 ✅
Engaged: 7910/7910 ✅

🏆 Overall validation: ✅ ALL METRICS MATCH!
```

## Troubleshooting

### Connection Issues

1. **Invalid API Key**:
   ```
   Error: AIRTABLE_API_KEY is required
   ```
   - Check your `.env` file
   - Verify the API key is correct

2. **Rate Limiting**:
   - The system includes automatic delays (200ms) between batches
   - If you hit rate limits, the delays will be increased automatically

3. **Database Connection**:
   ```bash
   # Make sure PostgreSQL is running
   npm run docker:up

   # Run migrations if needed
   npm run migrate
   npm run seed
   ```

### Validation Failures

If metrics don't match expected values:

1. Check the data processing rules in `src/services/dataProcessor.js`
2. Verify Airtable field names match exactly
3. Use the test endpoint to inspect sample data:
   ```bash
   curl http://localhost:3000/api/test/data-processor
   ```

### Performance

- **Batch Size**: 100 records per batch (optimized for Airtable rate limits)
- **Processing Rate**: ~40-50 records per second
- **Memory Usage**: Minimal (processes in batches, not all at once)
- **Total Time**: ~8-10 minutes for 20,077 records

## Scripts Reference

```bash
# Database setup
npm run docker:up        # Start PostgreSQL
npm run migrate          # Run database migrations
npm run seed            # Seed automation data

# Import process
npm run import          # Full Airtable import with validation

# Testing
npm run server          # Start API server
npm run server:dev      # Start API server with auto-reload
npm run test:airtable   # Quick connection test

# Docker management
npm run docker:down     # Stop PostgreSQL
npm run docker:logs     # View PostgreSQL logs
```