// Types for course modules and related entities
export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleLecture {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  slides_url: string;
  sequence_order: number;
  duration: string;
  created_at: string;
  updated_at: string;
}

export interface LectureAttachment {
  id: string;
  lecture_id: string;
  title: string;
  description: string;
  attachment_url: string;
  cloudinary_public_id: string;
  attachment_type: 'video' | 'slides' | 'document' | 'image';
  created_at: string;
  updated_at: string;
}

export interface ModuleQuiz {
  id: string;
  lecture_id: string;
  title: string;
  description: string;
  passing_score: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleProject {
  id: string;
  module_id: string;
  title: string;
  description: string;
  instructions: string;
  resources_urls: string[];
  submission_type: 'file' | 'link' | 'text';
  created_at: string;
  updated_at: string;
}

export interface CourseCapstoneProject {
  id: string;
  course_id: string;
  title: string;
  description: string;
  instructions: string;
  requirements: string;
  resources_urls: string[];
  submission_type: 'file' | 'link' | 'text';
  created_at: string;
  updated_at: string;
}

export interface UserQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProjectSubmission {
  id: string;
  user_id: string;
  project_id?: string;
  capstone_id?: string;
  submission_content: string;
  submission_url: string;
  feedback: string;
  score: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
