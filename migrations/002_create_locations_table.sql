-- Migration: Create locations table
-- Physical clinic locations (currently 1:1 with clients, designed for future 1:many)

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_locations_client_id ON locations(client_id);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_created_at ON locations(created_at);
CREATE INDEX idx_locations_city_state ON locations(city, state);