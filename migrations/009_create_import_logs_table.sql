-- Migration: Create import_logs table
-- Track import runs with detailed statistics and status

CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50) NOT NULL DEFAULT 'airtable_sync',
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Import statistics
    total_records_fetched INTEGER DEFAULT 0,
    total_records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,

    -- Specific metrics
    conversations_created INTEGER DEFAULT 0,
    bookings_created INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    engaged_conversations INTEGER DEFAULT 0,

    -- Client/Location metrics
    clients_created INTEGER DEFAULT 0,
    locations_created INTEGER DEFAULT 0,
    customers_created INTEGER DEFAULT 0,
    customers_updated INTEGER DEFAULT 0,

    -- Error tracking
    error_count INTEGER DEFAULT 0,
    error_message TEXT,

    -- Performance metrics
    duration_seconds INTEGER,
    records_per_second DECIMAL(10, 2),

    -- Import configuration
    incremental BOOLEAN DEFAULT FALSE,
    last_modified_filter TIMESTAMP WITH TIME ZONE,

    -- Additional metadata
    triggered_by VARCHAR(50) DEFAULT 'scheduler', -- 'scheduler', 'manual', 'startup'
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_started_at ON import_logs(started_at DESC);
CREATE INDEX idx_import_logs_import_type ON import_logs(import_type);
CREATE INDEX idx_import_logs_triggered_by ON import_logs(triggered_by);

-- Create a partial index for active imports
CREATE INDEX idx_import_logs_active ON import_logs(started_at DESC)
WHERE status = 'running';