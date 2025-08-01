-- Truncate events table completely (bypasses RLS)
-- This will remove ALL data and reset the table

-- Temporarily disable RLS for cleanup
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Truncate the table (removes all data)
TRUNCATE TABLE public.events RESTART IDENTITY;

-- Re-enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Confirm table is empty
DO $$
DECLARE
    event_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO event_count FROM public.events;
    RAISE NOTICE 'Events table now contains % records', event_count;
    
    IF event_count = 0 THEN
        RAISE NOTICE '✅ Events table successfully cleaned!';
    ELSE
        RAISE NOTICE '❌ Events table still contains data';
    END IF;
END $$;