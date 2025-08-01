/*
  # Allow Anonymous Users to Like and Comment (Version 2)
  
  This migration dynamically finds and drops all constraints before schema changes.
*/

-- ========== DROP ALL EXISTING POLICIES FIRST ==========

-- Drop ALL possible blog likes policies
DROP POLICY IF EXISTS "blog_likes_select_policy" ON blog_likes;
DROP POLICY IF EXISTS "blog_likes_insert_policy" ON blog_likes;
DROP POLICY IF EXISTS "blog_likes_update_policy" ON blog_likes;
DROP POLICY IF EXISTS "blog_likes_delete_policy" ON blog_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON blog_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users can update likes" ON blog_likes;
DROP POLICY IF EXISTS "Authenticated users can delete likes" ON blog_likes;

-- Drop ALL possible comment policies
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- ========== DYNAMICALLY DROP ALL CONSTRAINTS ==========

-- Function to drop all constraints on a table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all constraints on blog_likes table
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'blog_likes' 
        AND constraint_type IN ('FOREIGN KEY', 'UNIQUE')
    ) LOOP
        EXECUTE 'ALTER TABLE blog_likes DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
    END LOOP;
    
    -- Drop all constraints on comments table
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'comments' 
        AND constraint_type IN ('FOREIGN KEY', 'UNIQUE')
        AND constraint_name != 'comments_pkey'  -- Keep primary key
    ) LOOP
        EXECUTE 'ALTER TABLE comments DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
    END LOOP;
END $$;

-- ========== ALTER TABLE SCHEMAS ==========

-- Change blog_likes user_id to text
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_likes' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE blog_likes ALTER COLUMN user_id TYPE text USING user_id::text;
    END IF;
END $$;

-- Change comments user_id to text
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE comments ALTER COLUMN user_id TYPE text USING user_id::text;
    END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints back
ALTER TABLE blog_likes ADD CONSTRAINT blog_likes_user_id_blog_id_key UNIQUE(user_id, blog_id);
ALTER TABLE comments ADD CONSTRAINT check_blog_or_course CHECK (
  (blog_id IS NOT NULL AND course_id IS NULL) OR 
  (blog_id IS NULL AND course_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_likes_blog_id ON blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON blog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_comments_course_id ON comments(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ========== CREATE POLICIES FOR ANONYMOUS USERS ==========

-- Blog Likes Policies
CREATE POLICY "blog_likes_select_policy" ON blog_likes
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "blog_likes_insert_policy" ON blog_likes
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

CREATE POLICY "blog_likes_update_policy" ON blog_likes
  FOR UPDATE TO anon, authenticated
  USING (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  )
  WITH CHECK (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

CREATE POLICY "blog_likes_delete_policy" ON blog_likes
  FOR DELETE TO anon, authenticated
  USING (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

-- Comments Policies
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%')
  );

CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE TO anon, authenticated
  USING (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%') OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%') OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE TO anon, authenticated
  USING (
    (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text) OR
    (auth.role() = 'anon' AND user_id::text LIKE 'anonymous_%') OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ========== UTILITY FUNCTIONS ==========

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for comments
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add views column to blogs if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blogs' AND column_name = 'views') THEN
        ALTER TABLE blogs ADD COLUMN views integer DEFAULT 0;
    END IF;
END $$;

-- Blog views increment function
CREATE OR REPLACE FUNCTION increment_blog_views(blog_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blogs SET views = views + 1 WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_blog_views(uuid) TO anon, authenticated;

COMMIT;