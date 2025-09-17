-- Migration: Create location_automations table
-- Junction table linking locations to their active automations

CREATE TABLE IF NOT EXISTS location_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id, automation_id)
);

-- Create indexes for performance
CREATE INDEX idx_location_automations_location_id ON location_automations(location_id);
CREATE INDEX idx_location_automations_automation_id ON location_automations(automation_id);
CREATE INDEX idx_location_automations_created_at ON location_automations(created_at);