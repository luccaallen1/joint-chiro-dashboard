-- Migration: Create automations table
-- Different bot types and automation codes

CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL CHECK (code IN ('WB', 'IB', 'CB', 'DB', 'EB', 'TB', 'WEB')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Create indexes for performance
CREATE INDEX idx_automations_code ON automations(code);
CREATE INDEX idx_automations_status ON automations(status);