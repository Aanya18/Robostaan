import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Star, Edit, Trash2, Eye, Bell, BellOff, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/AuthProvider';
import { Course } from '../../lib/supabaseService';

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onDelete?: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();
  const { user } = useAuth();
  const [isNotifying, setIsNotifying] = useState(false);

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

  const isComingSoon = course.title.toLowerCase().includes('coming soon') || 
                      course.description.toLowerCase().includes('coming soon');

  const handleNotifyToggle = () => {
    setIsNotifying(!isNotifying);
    // Here you would typically save this to a database
    if (!isNotifying) {
      alert('You will be notified when this course becomes available!');
    }
  };

  return (
    <motion.div
      whileHover={{ y: isComingSoon ? 0 : -5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
        isComingSoon ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      <div className="relative">
        <img
          src={course.image}
          alt={course.title}
          className={`w-full h-48 object-cover ${isComingSoon ? 'filter blur-sm' : ''}`}
        />
        
        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            Coming Soon
          </div>
        )}
        
        {/* Featured Badge */}
        {course.featured && !isComingSoon && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Featured
          </div>
        )}
        
        {/* Category Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(course.category)}`}>
          {course.category}
        </div>
        
        {/* Admin Controls */}
        {user && isAdmin && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit?.(course)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete?.(course.id)}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {course.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
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
            <span>4.8</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isComingSoon ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNotifyToggle}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-medium transition-colors ${
                isNotifying
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {isNotifying ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              <span>{isNotifying ? 'Notifications On' : 'Notify Me'}</span>
            </motion.button>
          ) : (
            <>
              <Link to={`/course/${course.id}`} className={isAdmin ? "flex-1" : "w-full"}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Course</span>
                </motion.button>
              </Link>
              
              {isAdmin && !isComingSoon && (
                <Link to={`/admin/course/${course.id}/modules`} className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Manage Modules</span>
                  </motion.button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;