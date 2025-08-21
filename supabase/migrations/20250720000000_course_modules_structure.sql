-- Create course_modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create module_lectures table
CREATE TABLE IF NOT EXISTS module_lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  slides_url TEXT,
  sequence_order INTEGER NOT NULL,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create lecture_attachments table
CREATE TABLE IF NOT EXISTS lecture_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID NOT NULL REFERENCES module_lectures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  attachment_type TEXT NOT NULL, -- 'video', 'slides', 'document', 'image'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create module_quizzes table
CREATE TABLE IF NOT EXISTS module_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID NOT NULL REFERENCES module_lectures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES module_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create quiz_options table
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create module_projects table
CREATE TABLE IF NOT EXISTS module_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  resources_urls TEXT[],
  submission_type TEXT, -- 'file', 'link', 'text'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create course_capstone_projects table
CREATE TABLE IF NOT EXISTS course_capstone_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  requirements TEXT,
  resources_urls TEXT[],
  submission_type TEXT, -- 'file', 'link', 'text'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_quiz_attempts table
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES module_quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  passed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_project_submissions table
CREATE TABLE IF NOT EXISTS user_project_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID,
  capstone_id UUID,
  submission_content TEXT,
  submission_url TEXT,
  feedback TEXT,
  score INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT project_or_capstone CHECK (
    (project_id IS NOT NULL AND capstone_id IS NULL) OR
    (project_id IS NULL AND capstone_id IS NOT NULL)
  ),
  CONSTRAINT project_fk FOREIGN KEY (project_id) REFERENCES module_projects(id) ON DELETE CASCADE,
  CONSTRAINT capstone_fk FOREIGN KEY (capstone_id) REFERENCES course_capstone_projects(id) ON DELETE CASCADE
);

-- Create RLS policies
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_capstone_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for each table
-- Everyone can view course modules
CREATE POLICY "Anyone can view course modules" ON course_modules
  FOR SELECT USING (true);

-- Only admins can insert, update, delete course modules
CREATE POLICY "Admins can insert course modules" ON course_modules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

CREATE POLICY "Admins can update course modules" ON course_modules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

CREATE POLICY "Admins can delete course modules" ON course_modules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Similar policies for other tables
-- Module lectures
CREATE POLICY "Anyone can view module lectures" ON module_lectures
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage module lectures" ON module_lectures
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Lecture attachments
CREATE POLICY "Anyone can view lecture attachments" ON lecture_attachments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lecture attachments" ON lecture_attachments
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Module quizzes
CREATE POLICY "Anyone can view module quizzes" ON module_quizzes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage module quizzes" ON module_quizzes
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Quiz questions
CREATE POLICY "Anyone can view quiz questions" ON quiz_questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Quiz options
CREATE POLICY "Anyone can view quiz options" ON quiz_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz options" ON quiz_options
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Module projects
CREATE POLICY "Anyone can view module projects" ON module_projects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage module projects" ON module_projects
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Course capstone projects
CREATE POLICY "Anyone can view capstone projects" ON course_capstone_projects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage capstone projects" ON course_capstone_projects
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- User quiz attempts - users can view their own attempts
CREATE POLICY "Users can view their own quiz attempts" ON user_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" ON user_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts" ON user_quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON user_quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- User project submissions - users can view their own submissions
CREATE POLICY "Users can view their own project submissions" ON user_project_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project submissions" ON user_project_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project submissions" ON user_project_submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all project submissions" ON user_project_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

CREATE POLICY "Admins can update all project submissions" ON user_project_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_module_lectures_updated_at
  BEFORE UPDATE ON module_lectures
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lecture_attachments_updated_at
  BEFORE UPDATE ON lecture_attachments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_module_quizzes_updated_at
  BEFORE UPDATE ON module_quizzes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_quiz_options_updated_at
  BEFORE UPDATE ON quiz_options
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_module_projects_updated_at
  BEFORE UPDATE ON module_projects
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_course_capstone_projects_updated_at
  BEFORE UPDATE ON course_capstone_projects
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_quiz_attempts_updated_at
  BEFORE UPDATE ON user_quiz_attempts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_project_submissions_updated_at
  BEFORE UPDATE ON user_project_submissions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
