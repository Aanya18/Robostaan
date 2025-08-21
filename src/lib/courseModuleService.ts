import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConnection } from './supabaseConnection';
import {
  CourseModule,
  ModuleLecture,
  LectureAttachment,
  ModuleQuiz,
  QuizQuestion,
  QuizOption,
  ModuleProject,
  CourseCapstoneProject,
  UserQuizAttempt,
  UserProjectSubmission
} from './courseModuleTypes';

// Course Module Service class
class CourseModuleService {
  private readonly connection = getSupabaseConnection();

  // ========== COURSE MODULES OPERATIONS ==========
  
  async getCourseModules(courseId: string): Promise<{ data: CourseModule[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sequence_order', { ascending: true });
      
      return { data: data ?? [], error };
    });
  }

  async getCourseModuleById(id: string): Promise<{ data: CourseModule | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_modules')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async createCourseModule(module: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: CourseModule | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_modules')
        .insert(module)
        .select()
        .single();
    });
  }

  async updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<{ data: CourseModule | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteCourseModule(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_modules')
        .delete()
        .eq('id', id);
    });
  }

  // ========== MODULE LECTURES OPERATIONS ==========
  
  async getModuleLectures(moduleId: string): Promise<{ data: ModuleLecture[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('module_lectures')
        .select('*')
        .eq('module_id', moduleId)
        .order('sequence_order', { ascending: true });
      
      return { data: data ?? [], error };
    });
  }

  async getModuleLectureById(id: string): Promise<{ data: ModuleLecture | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_lectures')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async createModuleLecture(lecture: Omit<ModuleLecture, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ModuleLecture | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_lectures')
        .insert(lecture)
        .select()
        .single();
    });
  }

  async updateModuleLecture(id: string, updates: Partial<ModuleLecture>): Promise<{ data: ModuleLecture | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_lectures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteModuleLecture(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_lectures')
        .delete()
        .eq('id', id);
    });
  }

  // ========== LECTURE ATTACHMENTS OPERATIONS ==========
  
  async getLectureAttachments(lectureId: string): Promise<{ data: LectureAttachment[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('lecture_attachments')
        .select('*')
        .eq('lecture_id', lectureId);
      
      return { data: data ?? [], error };
    });
  }

  async createLectureAttachment(attachment: Omit<LectureAttachment, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: LectureAttachment | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('lecture_attachments')
        .insert(attachment)
        .select()
        .single();
    });
  }

  async deleteLectureAttachment(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('lecture_attachments')
        .delete()
        .eq('id', id);
    });
  }

  // ========== MODULE QUIZZES OPERATIONS ==========
  
  async getLectureQuiz(lectureId: string): Promise<{ data: ModuleQuiz | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_quizzes')
        .select('*')
        .eq('lecture_id', lectureId)
        .single();
    });
  }

  async createModuleQuiz(quiz: Omit<ModuleQuiz, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ModuleQuiz | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_quizzes')
        .insert(quiz)
        .select()
        .single();
    });
  }

  async updateModuleQuiz(id: string, updates: Partial<ModuleQuiz>): Promise<{ data: ModuleQuiz | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async getQuizQuestions(quizId: string): Promise<{ data: QuizQuestion[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('sequence_order', { ascending: true });
      
      return { data: data ?? [], error };
    });
  }

  async createQuizQuestion(question: Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: QuizQuestion | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('quiz_questions')
        .insert(question)
        .select()
        .single();
    });
  }

  async getQuizOptions(questionId: string): Promise<{ data: QuizOption[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('quiz_options')
        .select('*')
        .eq('question_id', questionId)
        .order('sequence_order', { ascending: true });
      
      return { data: data ?? [], error };
    });
  }

  async createQuizOption(option: Omit<QuizOption, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: QuizOption | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('quiz_options')
        .insert(option)
        .select()
        .single();
    });
  }

  // ========== MODULE PROJECTS OPERATIONS ==========
  
  async getModuleProject(moduleId: string): Promise<{ data: ModuleProject | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_projects')
        .select('*')
        .eq('module_id', moduleId)
        .single();
    });
  }

  async createModuleProject(project: Omit<ModuleProject, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ModuleProject | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_projects')
        .insert(project)
        .select()
        .single();
    });
  }

  async updateModuleProject(id: string, updates: Partial<ModuleProject>): Promise<{ data: ModuleProject | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('module_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  // ========== CAPSTONE PROJECTS OPERATIONS ==========
  
  async getCourseCapstoneProject(courseId: string): Promise<{ data: CourseCapstoneProject | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_capstone_projects')
        .select('*')
        .eq('course_id', courseId)
        .single();
    });
  }

  async createCourseCapstoneProject(project: Omit<CourseCapstoneProject, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: CourseCapstoneProject | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_capstone_projects')
        .insert(project)
        .select()
        .single();
    });
  }

  async updateCourseCapstoneProject(id: string, updates: Partial<CourseCapstoneProject>): Promise<{ data: CourseCapstoneProject | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_capstone_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  // ========== USER QUIZ ATTEMPTS OPERATIONS ==========
  
  async getUserQuizAttempts(userId: string, quizId: string): Promise<{ data: UserQuizAttempt[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });
      
      return { data: data ?? [], error };
    });
  }

  async createUserQuizAttempt(attempt: Omit<UserQuizAttempt, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: UserQuizAttempt | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('user_quiz_attempts')
        .insert(attempt)
        .select()
        .single();
    });
  }

  // ========== USER PROJECT SUBMISSIONS OPERATIONS ==========
  
  async getUserProjectSubmissions(userId: string, projectId?: string, capstoneId?: string): Promise<{ data: UserProjectSubmission[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      let query = client
        .from('user_project_submissions')
        .select('*')
        .eq('user_id', userId);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      if (capstoneId) {
        query = query.eq('capstone_id', capstoneId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      return { data: data ?? [], error };
    });
  }

  async createUserProjectSubmission(submission: Omit<UserProjectSubmission, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: UserProjectSubmission | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('user_project_submissions')
        .insert(submission)
        .select()
        .single();
    });
  }

  async updateUserProjectSubmission(id: string, updates: Partial<UserProjectSubmission>): Promise<{ data: UserProjectSubmission | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('user_project_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get complete course structure with all modules, lectures, quizzes, and projects
   */
  async getCompleteCourseStructure(courseId: string) {
    try {
      // Get all modules for the course
      const { data: modules, error: modulesError } = await this.getCourseModules(courseId);

      if (modulesError) {
        throw new Error(`Failed to get course modules: ${modulesError.message}`);
      }

      const completeStructure = [];

      // For each module, get its lectures, quizzes, and project
      for (const module of modules) {
        const moduleStructure = {
          ...module,
          lectures: [],
          project: null
        };

        // Get lectures for the module
        const { data: lectures, error: lecturesError } = await this.getModuleLectures(module.id);

        if (lecturesError) {
          throw new Error(`Failed to get module lectures: ${lecturesError.message}`);
        }

        // For each lecture, get its attachments and quiz
        for (const lecture of lectures) {
          const lectureStructure = {
            ...lecture,
            attachments: [],
            quiz: null
          };

          // Get attachments for the lecture
          const { data: attachments, error: attachmentsError } = await this.getLectureAttachments(lecture.id);

          if (!attachmentsError) {
            lectureStructure.attachments = attachments;
          }

          // Get quiz for the lecture
          const { data: quiz, error: quizError } = await this.getLectureQuiz(lecture.id);

          if (!quizError && quiz) {
            const quizStructure = {
              ...quiz,
              questions: []
            };

            // Get questions for the quiz
            const { data: questions, error: questionsError } = await this.getQuizQuestions(quiz.id);

            if (!questionsError) {
              // For each question, get its options
              for (const question of questions) {
                const questionStructure = {
                  ...question,
                  options: []
                };

                const { data: options, error: optionsError } = await this.getQuizOptions(question.id);

                if (!optionsError) {
                  questionStructure.options = options;
                }

                quizStructure.questions.push(questionStructure);
              }
            }

            lectureStructure.quiz = quizStructure;
          }

          moduleStructure.lectures.push(lectureStructure);
        }

        // Get project for the module
        const { data: project, error: projectError } = await this.getModuleProject(module.id);

        if (!projectError && project) {
          moduleStructure.project = project;
        }

        completeStructure.push(moduleStructure);
      }

      // Get capstone project for the course
      const { data: capstoneProject, error: capstoneError } = await this.getCourseCapstoneProject(courseId);

      return {
        modules: completeStructure,
        capstoneProject: !capstoneError ? capstoneProject : null
      };
    } catch (error) {
      console.error('Error getting complete course structure:', error);
      throw error;
    }
  }
}

// Create and export an instance of the service
export const courseModuleService = new CourseModuleService();

// Export individual methods for convenience
export const {
  // Course Modules
  getCourseModules,
  getCourseModuleById,
  createCourseModule,
  updateCourseModule,
  deleteCourseModule,
  // Module Lectures
  getModuleLectures,
  getModuleLectureById,
  createModuleLecture,
  updateModuleLecture,
  deleteModuleLecture,
  // Lecture Attachments
  getLectureAttachments,
  createLectureAttachment,
  deleteLectureAttachment,
  // Module Quizzes
  getLectureQuiz,
  createModuleQuiz,
  updateModuleQuiz,
  getQuizQuestions,
  createQuizQuestion,
  getQuizOptions,
  createQuizOption,
  // Module Projects
  getModuleProject,
  createModuleProject,
  updateModuleProject,
  // Capstone Projects
  getCourseCapstoneProject,
  createCourseCapstoneProject,
  updateCourseCapstoneProject,
  // User Quiz Attempts
  getUserQuizAttempts,
  createUserQuizAttempt,
  // User Project Submissions
  getUserProjectSubmissions,
  createUserProjectSubmission,
  updateUserProjectSubmission,
  // Utility Methods
  getCompleteCourseStructure
} = courseModuleService;
