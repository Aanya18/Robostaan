import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, Star, Play, Download, BookOpen } from 'lucide-react';
import { getSupabaseConnection } from '../lib/supabaseConnection';
import QuillContent from '../components/RichTextEditor/QuillContent';

type Course = {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  category: string;
  duration?: string;
  featured?: boolean;
  video_url?: string;
  created_at?: string;
  updated_at?: string;
  materials?: string[];
};

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connection = getSupabaseConnection();

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      try {
        const { data, error } = await connection.executeWithRetry(async (client) => {
          return await client
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
        });

        if (error) throw error;
        setCourse(data);
      } catch (err) {
        setError('Failed to load course');
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, connection]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Beginner':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Advanced':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Course not found
          </h1>
          <Link
            to="/courses"
            className="text-orange-500 hover:text-orange-600 transition-colors"
          >
            ← Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 text-orange-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-4 mb-4">
                {course.featured && (
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(course.category)}`}>
                  {course.category}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {course.title}
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                {course.description}
              </p>

              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>1,234 students</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>4.8 (324 reviews)</span>
                </div>
              </div>
            </motion.div>

            {/* Course Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
              />
            </motion.div>

            {/* Video Section */}
            {course.video_url && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Course Preview
                </h2>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-8 text-center">
                  <Play className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Watch the course introduction video
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Play Video
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Course Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Course Content
              </h2>
              <QuillContent 
                content={course.content}
                className="prose prose-lg max-w-none course-content"
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Enroll in this Course
              </h3>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors mb-6"
              >
                Enroll Now - Free
              </motion.button>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Level</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Students</span>
                  <span className="font-medium text-gray-900 dark:text-white">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Certificate</span>
                  <span className="font-medium text-gray-900 dark:text-white">Yes</span>
                </div>
              </div>

              {course.materials && course.materials.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Course Materials
                  </h4>
                  <div className="space-y-2">
                    {course.materials.map((material, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className="w-full flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                      >
                        <Download className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{material}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .course-content h1,
        .course-content h2,
        .course-content h3,
        .course-content h4,
        .course-content h5,
        .course-content h6 {
          color: inherit;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .course-content h1 { font-size: 2.25rem; }
        .course-content h2 { font-size: 1.875rem; }
        .course-content h3 { font-size: 1.5rem; }
        .course-content h4 { font-size: 1.25rem; }

        .course-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .course-content ul,
        .course-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .course-content li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default CourseDetail;