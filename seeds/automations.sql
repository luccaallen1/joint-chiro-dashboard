-- Seed data for automations table
-- Insert the predefined automation types

INSERT INTO automations (code, name, description, color, status) VALUES
('WB', 'Web Bot', 'Main website chatbot for general inquiries and initial contact', '#4F46E5', 'active'),
('IB', 'Intake Bot', 'Patient intake form automation for new patient onboarding', '#059669', 'active'),
('CB', 'Comment Bot', 'Social media comment response automation', '#DC2626', 'active'),
('DB', 'Default Bot', 'Fallback bot for unhandled queries and basic responses', '#6B7280', 'active'),
('EB', 'Engagement Bot', 'Customer engagement and follow-up automation', '#7C3AED', 'active'),
('TB', 'Test Bot', 'Testing and development bot for new features', '#F59E0B', 'active'),
('WEB', 'Web Alternative', 'Alternative web integration for specific use cases', '#0891B2', 'active')
ON CONFLICT (code) DO NOTHING;