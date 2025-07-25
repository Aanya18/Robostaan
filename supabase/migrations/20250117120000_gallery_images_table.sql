-- Create gallery_images table to store image metadata
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    cloudinary_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    cloudinary_secure_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    format VARCHAR(10),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON public.gallery_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_images_uploaded_by ON public.gallery_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_gallery_images_featured ON public.gallery_images(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_images_tags ON public.gallery_images USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_images_updated_at
    BEFORE UPDATE ON public.gallery_images
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery_images
-- Allow public read access for all gallery images
CREATE POLICY "Gallery images are viewable by everyone" ON public.gallery_images
    FOR SELECT USING (TRUE);

-- Allow authenticated users to insert images
CREATE POLICY "Users can upload gallery images" ON public.gallery_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own images or admins to update any
-- Also allow updates to images with NULL uploaded_by (for migration purposes)
CREATE POLICY "Users can update their own gallery images" ON public.gallery_images
    FOR UPDATE USING (
        uploaded_by IS NULL OR
        auth.uid() = uploaded_by OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow users to delete their own images or admins to delete any
-- Also allow deletion of images with NULL uploaded_by (for migration purposes)
CREATE POLICY "Users can delete their own gallery images" ON public.gallery_images
    FOR DELETE USING (
        uploaded_by IS NULL OR
        auth.uid() = uploaded_by OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON public.gallery_images TO authenticated;
GRANT SELECT ON public.gallery_images TO anon;