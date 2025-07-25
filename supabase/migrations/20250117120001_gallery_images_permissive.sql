-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Gallery images are viewable by everyone" ON public.gallery_images;
DROP POLICY IF EXISTS "Users can upload gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Users can update their own gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Users can delete their own gallery images" ON public.gallery_images;

-- Create more permissive policies for gallery functionality

-- Allow everyone (including anonymous users) to view gallery images
CREATE POLICY "Gallery images are viewable by everyone" ON public.gallery_images
    FOR SELECT USING (TRUE);

-- Allow everyone (including anonymous users) to insert images for gallery
-- This is useful for public galleries where anyone can contribute
CREATE POLICY "Anyone can upload gallery images" ON public.gallery_images
    FOR INSERT WITH CHECK (TRUE);

-- Allow users to update their own images or allow anonymous updates (for public gallery)
CREATE POLICY "Gallery images can be updated" ON public.gallery_images
    FOR UPDATE USING (
        -- Allow if user owns the image
        auth.uid() = uploaded_by OR 
        -- Allow if user is admin
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        -- Allow anonymous updates for public gallery (optional - you can remove this)
        uploaded_by IS NULL
    );

-- Allow users to delete their own images or admins to delete any
CREATE POLICY "Gallery images can be deleted" ON public.gallery_images
    FOR DELETE USING (
        -- Allow if user owns the image
        auth.uid() = uploaded_by OR 
        -- Allow if user is admin
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR
        -- Allow anonymous deletes for public gallery (optional - you can remove this)
        uploaded_by IS NULL
    );

-- Grant permissions to anonymous users as well
GRANT SELECT, INSERT ON public.gallery_images TO anon;
GRANT ALL ON public.gallery_images TO authenticated;