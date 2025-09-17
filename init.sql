-- Initialize database with basic setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if it doesn't exist (this runs in the default postgres db)
-- The actual database is created by the POSTGRES_DB environment variable