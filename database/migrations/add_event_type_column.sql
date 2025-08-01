-- Add event_type column to events table
-- Run this in Supabase SQL Editor

ALTER TABLE events 
ADD COLUMN event_type VARCHAR(50) DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN events.event_type IS 'Type of event: meetup, workshop, webinar, event, competition, hackathon';

-- Optional: Create an index for better query performance
CREATE INDEX idx_events_event_type ON events(event_type);

-- Update existing events with default event type (optional)
-- UPDATE events SET event_type = 'event' WHERE event_type IS NULL;