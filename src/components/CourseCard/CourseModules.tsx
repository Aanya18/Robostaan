import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Book, FileText, CheckCircle, Lock, Download, Clipboard, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/AuthProvider';

interface CourseModuleProps {
  courseId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modules: any[];
  userEnrolled: boolean;
  currentModuleIndex?: number;
}

const CourseModules: React.FC<CourseModuleProps> = ({ courseId, modules, userEnrolled, currentModuleIndex = -1 }) => {
  const { user } = useAuth();
  const [expandedModuleIndex, setExpandedModuleIndex] = useState<number>(currentModuleIndex);
  const [expandedLectureIndex, setExpandedLectureIndex] = useState<number>(-1);
  const [completedLectures, setCompletedLectures] = useState<Record<string, boolean>>({});
  const [userProgress, setUserProgress] = useState<number>(0);

  // Load user progress from localStorage
  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(`course_progress_${courseId}_${user.id}`);
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        setCompletedLectures(progressData.completedLectures || {});
        setUserProgress(progressData.progress || 0);
      }
    }
  }, [courseId, user]);

  // Calculate course progress
  useEffect(() => {
    if (!user || !modules.length) return;
    
    const totalLectures = modules.reduce((total, module) => total + module.lectures.length, 0);
    const completedCount = Object.values(completedLectures).filter(completed => completed).length;
    const progress = totalLectures > 0 ? Math.floor((completedCount / totalLectures) * 100) : 0;
    
    setUserProgress(progress);
    
    // Save progress to localStorage
    localStorage.setItem(`course_progress_${courseId}_${user.id}`, JSON.stringify({
      completedLectures,
      progress
    }));
  }, [completedLectures, modules, courseId, user]);

  const handleToggleModule = (index: number) => {
    setExpandedModuleIndex(expandedModuleIndex === index ? -1 : index);
    setExpandedLectureIndex(-1);
  };

  const handleToggleLecture = (index: number) => {
    setExpandedLectureIndex(expandedLectureIndex === index ? -1 : index);
  };

  const markLectureComplete = (lectureId: string) => {
    if (!user) return;
    setCompletedLectures(prev => ({
      ...prev,
      [lectureId]: true
    }));
  };

  if (!modules || modules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          No modules available yet
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          The course content is being prepared. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar for Enrolled Users */}
      {userEnrolled && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course Progress</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-orange-500 h-2.5 rounded-full"
              style={{ width: `${userProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <div 
            key={module.id} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button 
              onClick={() => handleToggleModule(moduleIndex)}
              className={`w-full flex justify-between items-center p-4 text-left ${
                expandedModuleIndex === moduleIndex 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 text-orange-500 font-bold mr-3">
                  {moduleIndex + 1}
                </span>
                <div>
                  <h3 className="font-bold">{module.title}</h3>
                  <p className={`text-sm ${expandedModuleIndex === moduleIndex ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {module.lectures.length} {module.lectures.length === 1 ? 'lecture' : 'lectures'}
                    {module.project && ' • 1 project'}
                  </p>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 transition-transform ${expandedModuleIndex === moduleIndex ? 'transform rotate-180' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <AnimatePresence>
              {expandedModuleIndex === moduleIndex && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {/* Module Description */}
                    {module.description && (
                      <div className="mb-4 text-gray-700 dark:text-gray-300">
                        {module.description}
                      </div>
                    )}

                    {/* Lectures List */}
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {module.lectures.map((lecture: any, lectureIndex: number) => (
                        <div key={lecture.id} className="bg-gray-50 dark:bg-gray-750 rounded-lg overflow-hidden">
                          <div 
                            className={`flex items-center justify-between p-3 cursor-pointer ${
                              !userEnrolled && lectureIndex > 0 ? 'opacity-60' : ''
                            }`}
                            onClick={() => userEnrolled || lectureIndex === 0 ? handleToggleLecture(lectureIndex) : null}
                          >
                            <div className="flex items-center">
                              {completedLectures[lecture.id] ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                              ) : !userEnrolled && lectureIndex > 0 ? (
                                <Lock className="w-5 h-5 text-gray-400 mr-3" />
                              ) : (
                                <Play className="w-5 h-5 text-orange-500 mr-3" />
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {lecture.title}
                                </h4>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  {lecture.duration && (
                                    <span className="mr-3">{lecture.duration}</span>
                                  )}
                                  {lecture.video_url && (
                                    <span className="mr-3 flex items-center">
                                      <Play className="w-3 h-3 mr-1" />
                                      Video
                                    </span>
                                  )}
                                  {lecture.slides_url && (
                                    <span className="mr-3 flex items-center">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Slides
                                    </span>
                                  )}
                                  {lecture.quiz && (
                                    <span className="mr-3 flex items-center">
                                      <Clipboard className="w-3 h-3 mr-1" />
                                      Quiz
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {(userEnrolled || lectureIndex === 0) && (
                              <svg 
                                className={`w-4 h-4 transition-transform ${expandedLectureIndex === lectureIndex ? 'transform rotate-180' : ''}`} 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          <AnimatePresence>
                            {expandedLectureIndex === lectureIndex && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                                  {/* Lecture Description */}
                                  {lecture.description && (
                                    <div className="text-gray-700 dark:text-gray-300">
                                      {lecture.description}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2">
                                    {/* Video Button */}
                                    {lecture.video_url && (
                                      <Link 
                                        to={`/course/${courseId}/lecture/${lecture.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                        onClick={() => markLectureComplete(lecture.id)}
                                      >
                                        <Play className="w-4 h-4 mr-2" />
                                        Watch Video
                                      </Link>
                                    )}

                                    {/* Slides Button */}
                                    {lecture.slides_url && (
                                      <a 
                                        href={lecture.slides_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Slides
                                      </a>
                                    )}

                                    {/* Quiz Button */}
                                    {lecture.quiz && (
                                      <Link 
                                        to={`/course/${courseId}/lecture/${lecture.id}/quiz`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                      >
                                        <Clipboard className="w-4 h-4 mr-2" />
                                        Take Quiz
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Module Project */}
                    {module.project && (
                      <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Book className="w-5 h-5 text-orange-500 mr-2" />
                          <h4 className="font-bold text-gray-900 dark:text-white">Module Project</h4>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{module.project.title}</p>
                        {userEnrolled ? (
                          <Link 
                            to={`/course/${courseId}/module/${module.id}/project`}
                            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                          >
                            <Book className="w-4 h-4 mr-2" />
                            View Project
                          </Link>
                        ) : (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Lock className="w-4 h-4 mr-2" />
                            <span>Enroll to access</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseModules;
