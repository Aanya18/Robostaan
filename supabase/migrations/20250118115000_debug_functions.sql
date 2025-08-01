-- Create debug functions to help diagnose issues

-- Function to get event count
CREATE OR REPLACE FUNCTION get_events_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.events);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get events with detailed info
CREATE OR REPLACE FUNCTION get_events_debug()
RETURNS TABLE(
    id UUID,
    title VARCHAR(255),
    description TEXT,
    cloudinary_folder VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    image_url TEXT,
    tags TEXT[],
    is_featured BOOLEAN,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.cloudinary_folder,
        e.date,
        e.location,
        e.image_url,
        e.tags,
        e.is_featured,
        e.created_by,
        e.created_at,
        e.updated_at
    FROM public.events e
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check RLS policies status
CREATE OR REPLACE FUNCTION check_events_policies()
RETURNS TABLE(
    policy_name TEXT,
    policy_permissive TEXT,
    policy_cmd TEXT,
    policy_qual TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pol.policyname::TEXT,
        pol.permissive::TEXT,
        pol.cmd::TEXT,
        pol.qual::TEXT
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE cls.relname = 'events' 
    AND nsp.nspname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_events_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_events_count() TO anon;
GRANT EXECUTE ON FUNCTION get_events_debug() TO authenticated;
GRANT EXECUTE ON FUNCTION get_events_debug() TO anon;
GRANT EXECUTE ON FUNCTION check_events_policies() TO authenticated;