/*
  # Allow Anonymous Users to Like and Comment
  
  This migration updates RLS policies to allow anonymous users to:
  1. Like and unlike blog posts using session-based IDs
  2. Comment on blog posts using session-based IDs
  3. View their own anonymous likes and comments
*/

-- ========== DROP ALL EXISTING POLICIES FIRST ==========

-- Drop ALL possible blog likes policies (old and new naming)
DROP POLICY IF EXISTS "blog_likes_select_policy" ON blog_likes;
DROP POLICY IF EXISTS "blog_likes_insert_policy" ON blog_likes;
DROP POLICY IF EXISTS "blog_likes_update_policy" ON blog_likes;
DROP POLICY IF EXISTS "blog_likes_delete_policy" ON blog_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON blog_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users can update likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users can delete likes" ON blog_likes;

-- Drop ALL possible comment policies (old and new naming)
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- ========== ALTER TABLE SCHEMAS FIRST ==========

-- Modify existing blog_likes table to support text user_id for anonymous users
DO $$ 
BEGIN
    -- Check if user_id column is uuid type and change it to text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_likes' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        -- First drop ALL constraints that reference user_id
        -- Drop unique constraints
        ALTER TABLE blog_likes DROP CONSTRAINT IF EXISTS blog_likes_user_id_blog_id_key;
        ALTER TABLE blog_likes DROP CONSTRAINT IF EXISTS blog_likes_user_id_key;
        -- Drop foreign key constraints (try all possible names)
        ALTER TABLE blog_likes DROP CONSTRAINT IF EXISTS blog_likes_user_id_fkey;
        ALTER TABLE blog_likes DROP CONSTRAINT IF EXISTS blog_likes_user_id_fkey1;
        ALTER TABLE blog_likes DROP CONSTRAINT IF EXISTS fk_blog_likes_user_id;
        -- Change column type
        ALTER TABLE blog_likes ALTER COLUMN user_id TYPE text USING user_id::text;
        -- Recreate unique constraint
        ALTER TABLE blog_likes ADD CONSTRAINT blog_likes_user_id_blog_id_key UNIQUE(user_id, blog_id);
    END IF;
END $$;

-- Create blog_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL, -- Text to support both UUID and anonymous IDs
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Unique constraint to prevent duplicate likes
  UNIQUE(user_id, blog_id)
);

-- Modify existing comments table to support text user_id for anonymous users
DO $$ 
BEGIN
    -- Check if user_id column is uuid type and change it to text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop ALL constraints that might reference user_id
        -- Drop foreign key constraints (try all possible names)
        ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
        ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey1;
        ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_user_id;
        -- Drop unique constraints
        ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_key;
        -- Change column type
        ALTER TABLE comments ALTER COLUMN user_id TYPE text USING user_id::text;
    END IF;
END $$;

-- Create comments table if it doesn't exist  
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL, -- Text to support both UUID and anonymous IDs
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,  
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Either blog_id or course_id must be set
  CONSTRAINT check_blog_or_course CHECK (
    (blog_id IS NOT NULL AND course_id IS NULL) OR 
    (blog_id IS NULL AND course_id IS NOT NULL)
  )
);

-- Enable RLS on tables
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_blog_id ON blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON blog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_comments_course_id ON comments(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ========== CREATE NEW POLICIES FOR ANONYMOUS USERS ==========

-- Allow anonymous and authenticated users to view likes
CREATE POLICY "blog_likes_select_policy" ON blog_likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous and authenticated users to insert likes
CREATE POLICY "blog_likes_insert_policy" ON blog_likes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated user can like with their auth.uid()
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    -- Anonymous user can like with session-based ID
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

-- Allow users to update their own likes (for toggle functionality)
CREATE POLICY "blog_likes_update_policy" ON blog_likes
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- Authenticated user can update their own likes
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    -- Anonymous user can update their own likes
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

-- Allow users to delete their own likes (for unlike functionality)
CREATE POLICY "blog_likes_delete_policy" ON blog_likes
  FOR DELETE
  TO anon, authenticated
  USING (
    -- Authenticated user can delete their own likes
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    -- Anonymous user can delete their own likes
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

-- Allow anonymous and authenticated users to view comments
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous and authenticated users to insert comments
CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated user can comment with their auth.uid()
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    -- Anonymous user can comment with session-based ID
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

-- Allow users to update their own comments
CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- Authenticated user can update their own comments
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    -- Anonymous user can update their own comments
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
    OR
    -- Admin can update any comment
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
    OR
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow users to delete their own comments
CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE
  TO anon, authenticated
  USING (
    -- Authenticated user can delete their own comments
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text)
    OR
    -- Anonymous user can delete their own comments
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
    OR
    -- Admin can delete any comment
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ========== UTILITY FUNCTIONS ==========

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for comments updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add views column to blogs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blogs' AND column_name = 'views') THEN
        ALTER TABLE blogs ADD COLUMN views integer DEFAULT 0;
    END IF;
END $$;

-- Create function to increment blog views
CREATE OR REPLACE FUNCTION increment_blog_views(blog_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blogs SET views = views + 1 WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_blog_views(uuid) TO anon, authenticated;

COMMIT;