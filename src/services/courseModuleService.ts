/* eslint-disable @typescript-eslint/no-explicit-any */
// (No type imports needed currently)

import {
  createCourseModule,
  getCourseModules,
  createModuleLecture,
  getModuleLectures,
  createLectureAttachment,
  getLectureAttachments,
  createModuleQuiz,
  getLectureQuiz,
  createQuizQuestion,
  getQuizQuestions,
  createQuizOption,
  getQuizOptions,
  createModuleProject,
  getModuleProject,
  createCourseCapstoneProject,
  getCourseCapstoneProject
} from '../lib/courseModuleService';
import { cloudinaryService } from './cloudinaryService';

class CourseModuleService {
  /**
   * Create a complete module structure with lectures, quizzes, and a project
   */
  async createModuleWithContent(
    courseId: string,
    moduleInfo: {
      title: string;
      description: string;
      sequenceOrder: number;
      lectures: {
        title: string;
        description: string;
        content: string;
        videoFile?: File;
        slidesFile?: File;
        sequenceOrder: number;
        duration: string;
        quiz?: {
          title: string;
          description: string;
          passingScore: number;
          questions: {
            questionText: string;
            questionType: 'multiple_choice' | 'true_false' | 'short_answer';
            sequenceOrder: number;
            options?: {
              optionText: string;
              isCorrect: boolean;
              sequenceOrder: number;
            }[]
          }[]
        }
      }[];
      project?: {
        title: string;
        description: string;
        instructions: string;
        resourcesUrls: string[];
        submissionType: 'file' | 'link' | 'text';
      }
    }
  ) {
    try {
      // Create the module record
      const { data: createdModule, error: moduleError } = await createCourseModule({
        course_id: courseId,
        title: moduleInfo.title,
        description: moduleInfo.description,
        sequence_order: moduleInfo.sequenceOrder
      });

      if (moduleError || !createdModule) {
        throw new Error(`Failed to create module: ${moduleError?.message || 'Unknown error'}`);
      }

      const moduleId = createdModule.id;

      // Create lectures with videos, slides and quizzes
      for (const lectureData of moduleInfo.lectures) {
        await this.createLectureWithContent(moduleId, lectureData);
      }

      // Create module project if provided
      if (moduleInfo.project) {
        await createModuleProject({
          module_id: moduleId,
          title: moduleInfo.project.title,
          description: moduleInfo.project.description,
          instructions: moduleInfo.project.instructions,
          resources_urls: moduleInfo.project.resourcesUrls,
          submission_type: moduleInfo.project.submissionType
        });
      }

      return { moduleId };
    } catch (error) {
      console.error('Error creating module with content:', error);
      throw error;
    }
  }

  /**
   * Create a lecture with video, slides and quiz
   */
  async createLectureWithContent(
    moduleId: string,
    lectureData: {
      title: string;
      description: string;
      content: string;
      videoFile?: File;
      slidesFile?: File;
      sequenceOrder: number;
      duration: string;
      quiz?: {
        title: string;
        description: string;
        passingScore: number;
        questions: {
          questionText: string;
          questionType: 'multiple_choice' | 'true_false' | 'short_answer';
          sequenceOrder: number;
          options?: {
            optionText: string;
            isCorrect: boolean;
            sequenceOrder: number;
          }[]
        }[]
      }
    }
  ) {
    try {
      let videoUrl = '';
      let slidesUrl = '';

      // Upload video if provided
      if (lectureData.videoFile) {
        const videoUploadResult = await cloudinaryService.uploadFile(lectureData.videoFile, {
          resourceType: 'video',
          folder: `courses/${moduleId}/lectures`,
          tags: ['course', 'lecture', 'video']
        });
        videoUrl = videoUploadResult.secure_url;
      }

      // Upload slides if provided
      if (lectureData.slidesFile) {
        const slidesUploadResult = await cloudinaryService.uploadFile(lectureData.slidesFile, {
          resourceType: 'raw',
          folder: `courses/${moduleId}/lectures`,
          tags: ['course', 'lecture', 'slides']
        });
        slidesUrl = slidesUploadResult.secure_url;
      }

      // Create the lecture
      const { data: createdLectureData, error: lectureError } = await createModuleLecture({
        module_id: moduleId,
        title: lectureData.title,
        description: lectureData.description,
        content: lectureData.content,
        video_url: videoUrl,
        slides_url: slidesUrl,
        sequence_order: lectureData.sequenceOrder,
        duration: lectureData.duration
      });

      if (lectureError || !createdLectureData) {
        throw new Error(`Failed to create lecture: ${lectureError?.message || 'Unknown error'}`);
      }

      const lectureId = createdLectureData.id;

      // Create lecture attachments for video and slides
      if (videoUrl) {
        await createLectureAttachment({
          lecture_id: lectureId,
          title: `${lectureData.title} - Video`,
          description: `Video for ${lectureData.title}`,
          attachment_url: videoUrl,
          cloudinary_public_id: `courses/${moduleId}/lectures/${lectureId}/video`,
          attachment_type: 'video'
        });
      }

      if (slidesUrl) {
        await createLectureAttachment({
          lecture_id: lectureId,
          title: `${lectureData.title} - Slides`,
          description: `Slides for ${lectureData.title}`,
          attachment_url: slidesUrl,
          cloudinary_public_id: `courses/${moduleId}/lectures/${lectureId}/slides`,
          attachment_type: 'slides'
        });
      }

      // Create quiz if provided
      if (lectureData.quiz) {
        await this.createQuizWithQuestions(lectureId, lectureData.quiz);
      }

      return { lectureId };
    } catch (error) {
      console.error('Error creating lecture with content:', error);
      throw error;
    }
  }

  /**
   * Create a quiz with questions and options
   */
  async createQuizWithQuestions(
    lectureId: string,
    quizData: {
      title: string;
      description: string;
      passingScore: number;
      questions: {
        questionText: string;
        questionType: 'multiple_choice' | 'true_false' | 'short_answer';
        sequenceOrder: number;
        options?: {
          optionText: string;
          isCorrect: boolean;
          sequenceOrder: number;
        }[]
      }[]
    }
  ) {
    try {
      // Create the quiz
      const { data: createdQuiz, error: quizError } = await createModuleQuiz({
        lecture_id: lectureId,
        title: quizData.title,
        description: quizData.description,
        passing_score: quizData.passingScore
      });

      if (quizError || !createdQuiz) {
        throw new Error(`Failed to create quiz: ${quizError?.message || 'Unknown error'}`);
      }

      const quizId = createdQuiz.id;

      // Create questions and options
      for (const questionData of quizData.questions) {
        const { data: createdQuestion, error: questionError } = await createQuizQuestion({
          quiz_id: quizId,
          question_text: questionData.questionText,
          question_type: questionData.questionType,
          sequence_order: questionData.sequenceOrder
        });

        if (questionError || !createdQuestion) {
          throw new Error(`Failed to create question: ${questionError?.message || 'Unknown error'}`);
        }

        const questionId = createdQuestion.id;

        // Create options for the question if provided
        if (questionData.options && questionData.options.length > 0) {
          for (const optionData of questionData.options) {
            await createQuizOption({
              question_id: questionId,
              option_text: optionData.optionText,
              is_correct: optionData.isCorrect,
              sequence_order: optionData.sequenceOrder
            });
          }
        }
      }

      return { quizId };
    } catch (error) {
      console.error('Error creating quiz with questions:', error);
      throw error;
    }
  }

  /**
   * Create a capstone project for a course
   */
  async createCapstoneProject(
    courseId: string,
    projectInfo: {
      title: string;
      description: string;
      instructions: string;
      requirements: string;
      resourcesUrls: string[];
      submissionType: 'file' | 'link' | 'text';
    }
  ) {
    try {
      const { data: createdProject, error: projectError } = await createCourseCapstoneProject({
        course_id: courseId,
        title: projectInfo.title,
        description: projectInfo.description,
        instructions: projectInfo.instructions,
        requirements: projectInfo.requirements,
        resources_urls: projectInfo.resourcesUrls,
        submission_type: projectInfo.submissionType
      });

      if (projectError || !createdProject) {
        throw new Error(`Failed to create capstone project: ${projectError?.message || 'Unknown error'}`);
      }
      return { projectId: createdProject.id };
    } catch (error) {
      console.error('Error creating capstone project:', error);
      throw error;
    }
  }

  /**
   * Get a complete course structure with all modules, lectures, quizzes, and projects
   */
  async getCompleteCourseStructure(courseId: string) {
    try {
      // Get all modules for the course
      const { data: modules, error: modulesError } = await getCourseModules(courseId);

      if (modulesError) {
        throw new Error(`Failed to get course modules: ${modulesError.message}`);
      }

      const completeStructure = [];

      // For each module, get its lectures, quizzes, and project
      for (const module of modules) {
        const moduleStructure: any = {
          ...module,
          lectures: [],
          project: null
        };

        // Get lectures for the module
        const { data: lectures, error: lecturesError } = await getModuleLectures(module.id);

        if (lecturesError) {
          throw new Error(`Failed to get module lectures: ${lecturesError.message}`);
        }

        // For each lecture, get its attachments and quiz
        for (const lecture of lectures) {
          const lectureStructure: any = {
            ...lecture,
            attachments: [],
            quiz: null
          };

          // Get attachments for the lecture
          const { data: attachments, error: attachmentsError } = await getLectureAttachments(lecture.id);

          if (!attachmentsError) {
            lectureStructure.attachments = attachments;
          }

          // Get quiz for the lecture
          const { data: quiz, error: quizError } = await getLectureQuiz(lecture.id);

          if (!quizError && quiz) {
            const quizStructure = {
              ...quiz,
              questions: [] as any[]
            };

            // Get questions for the quiz
            const { data: questions, error: questionsError } = await getQuizQuestions(quiz.id);

            if (!questionsError) {
              // For each question, get its options
              for (const question of questions) {
                const questionStructure = {
                  ...question,
                  options: [] as any[]
                };

                const { data: options, error: optionsError } = await getQuizOptions(question.id);

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
        const { data: project, error: projectError } = await getModuleProject(module.id);

        if (!projectError && project) {
          moduleStructure.project = project;
        }

        completeStructure.push(moduleStructure);
      }

      // Get capstone project for the course
      const { data: capstoneProject, error: capstoneError } = await getCourseCapstoneProject(courseId);

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

export const courseModuleService = new CourseModuleService();
