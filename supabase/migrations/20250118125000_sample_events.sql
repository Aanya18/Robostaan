-- Insert sample events for testing
-- These will only be inserted if no events exist

DO $$
BEGIN
    -- Only insert if events table is empty
    IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) THEN
        
        INSERT INTO public.events (
            title,
            description,
            cloudinary_folder,
            date,
            location,
            image_url,
            tags,
            is_featured,
            created_by
        ) VALUES
        (
            'Robotics Workshop 2024',
            'Learn the basics of robotics, from sensors to actuators. Perfect for beginners and intermediate learners.',
            'robotics-workshop-2024',
            '2024-03-15 10:00:00+00',
            'Tech Hub, Delhi',
            'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
            ARRAY['robotics', 'workshop', 'beginner'],
            true
        ),
        (
            'AI & Machine Learning Seminar',
            'Explore the latest trends in AI and ML with industry experts. Includes hands-on coding sessions.',
            'ai-ml-seminar-2024',
            '2024-04-20 14:00:00+00',
            'Innovation Center, Mumbai',
            'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800',
            ARRAY['ai', 'machine-learning', 'seminar'],
            true
        ),
        (
            'Drone Racing Competition',
            'High-speed drone racing competition with prizes for top 3 finishers. Open to all skill levels.',
            'drone-racing-2024',
            '2024-05-10 09:00:00+00',
            'Sports Complex, Bangalore',
            'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
            ARRAY['drone', 'racing', 'competition'],
            false
        ),
        (
            'IoT Hardware Meetup',
            'Monthly meetup for IoT enthusiasts. Share your projects and learn from others.',
            'iot-hardware-meetup-april',
            '2024-04-05 18:00:00+00',
            'Co-working Space, Pune',
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
            ARRAY['iot', 'hardware', 'meetup'],
            false
        ),
        (
            '3D Printing Masterclass',
            'Advanced 3D printing techniques and materials. Bring your own models to print.',
            '3d-printing-masterclass',
            '2024-03-25 11:00:00+00',
            'Maker Space, Chennai',
            'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
            ARRAY['3d-printing', 'masterclass', 'maker'],
            true
        );

        RAISE NOTICE 'Sample events inserted successfully';
    ELSE
        RAISE NOTICE 'Events already exist, skipping sample data insertion';
    END IF;
END $$;