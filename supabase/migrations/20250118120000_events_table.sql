
-- Create events table to store event data with cloudinary folder names
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cloudinary_folder VARCHAR(255) NOT NULL UNIQUE,
    date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_folder ON public.events(cloudinary_folder);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN(tags);

-- Create updated_at trigger
CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
-- Allow public read access for all events
CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (TRUE);

-- Allow authenticated users (admins) to insert events
CREATE POLICY "Admins can create events" ON public.events
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update events
CREATE POLICY "Admins can update events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to delete events
CREATE POLICY "Admins can delete events" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;