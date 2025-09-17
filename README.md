# JointChiro Data Dashboard

PostgreSQL database system for chiropractic clinic chatbot booking platform.

## Overview

This system manages data for a chiropractic clinic chatbot platform that handles patient bookings and conversations across multiple locations and automation types.

## Database Schema

### Core Tables

- **clients**: Chiropractic clinics using the chatbot platform
- **locations**: Physical clinic locations (currently 1:1 with clients, designed for future 1:many)
- **customers**: Patients chatting with bots
- **automations**: Bot types (WB/IB/CB/DB/EB/TB/WEB)
- **location_automations**: Junction table linking locations to active automations
- **conversations**: Chat conversations between customers and bots
- **bookings**: Appointment bookings made through the chatbot
- **leads**: Potential customers generated through conversations

## Quick Start

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd JointChiro.Data.Dashboard
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start PostgreSQL**
   ```bash
   npm run docker:up
   ```

4. **Run migrations**
   ```bash
   npm run migrate
   ```

5. **Seed initial data**
   ```bash
   npm run seed
   ```

## Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start with nodemon for development
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data
- `npm run docker:up` - Start PostgreSQL container
- `npm run docker:down` - Stop PostgreSQL container
- `npm run docker:logs` - View PostgreSQL logs

## Environment Variables

See `.env.example` for required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AIRTABLE_API_KEY` - Airtable integration key
- `AIRTABLE_BASE_ID` - Airtable base identifier
- `AIRTABLE_TABLE_ID` - Airtable table identifier

## Automation Codes

- **WB**: Web Bot - Main website chatbot
- **IB**: Intake Bot - Patient intake automation
- **CB**: Comment Bot - Social media response automation
- **DB**: Default Bot - Fallback bot for unhandled queries
- **EB**: Engagement Bot - Customer engagement automation
- **TB**: Test Bot - Testing and development bot
- **WEB**: Web Alternative - Alternative web integration

## Database Connection

The system uses connection pooling via the `pg` library. The connection module is located at `src/db/connection.js` and provides:

- Connection pooling
- Query logging
- Error handling
- Connection testing utilities

## Project Structure

```
JointChiro.Data.Dashboard/
├── migrations/           # Database migration files
├── seeds/               # Database seed files
├── src/
│   ├── db/
│   │   └── connection.js # Database connection module
│   ├── migrate.js       # Migration runner
│   ├── seed.js         # Seed data runner
│   └── index.js        # Main application file
├── docker-compose.yml   # PostgreSQL container setup
├── package.json        # Project dependencies
└── .env.example        # Environment variables template
```