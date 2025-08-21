import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthProvider';
import { Course, getCourseById } from '../../lib/supabaseService';
import { CourseModule } from '../../lib/courseModuleTypes';
import { getCourseModules, deleteCourseModule } from '../../lib/courseModuleService';
import CourseModuleUploader from './CourseModuleUploader';
import { cloudinaryService } from '../../services/cloudinaryService';

const CourseModuleManager: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderedModules, setReorderedModules] = useState<CourseModule[]>([]);

  // Load course and modules
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await getCourseById(courseId);
        
        if (courseError) throw new Error(`Failed to load course: ${courseError.message}`);
        if (!courseData) throw new Error('Course not found');
        
        setCourse(courseData);
        
        // Fetch modules
        const { data: modulesData, error: modulesError } = await getCourseModules(courseId);
        
        if (modulesError) throw new Error(`Failed to load modules: ${modulesError.message}`);
        
        setModules(modulesData);
        setReorderedModules(modulesData);
      } catch (err) {
        console.error('Error loading course data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Check permissions
  if (!isAdmin) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  const handleModuleAdded = (newModule: CourseModule) => {
    setModules(prev => [...prev, newModule]);
    setShowAddModule(false);
  };

  const handleModuleUpdated = (updatedModule: CourseModule) => {
    setModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
    setEditingModuleId(null);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (window.confirm('Are you sure you want to delete this module? This will delete all associated lectures, quizzes, and projects.')) {
      try {
        const { error } = await deleteCourseModule(moduleId);
        if (error) throw new Error(`Failed to delete module: ${error.message}`);
        
        setModules(prev => prev.filter(m => m.id !== moduleId));
      } catch (err) {
        console.error('Error deleting module:', err);
        alert('Failed to delete module. Please try again.');
      }
    }
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  };

  const handleReorderSave = async () => {
    try {
      // Update sequence order for each module
      for (const [index, module] of reorderedModules.entries()) {
        const newOrder = index + 1;
        if (module.sequence_order !== newOrder) {
          await fetch(`/api/modules/${module.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence_order: newOrder })
          });
        }
      }
      
      // Refresh modules
      const { data: refreshedModules, error } = await getCourseModules(courseId || '');
      if (error) throw error;
      
      setModules(refreshedModules);
      setReordering(false);
    } catch (err) {
      console.error('Error saving module order:', err);
      alert('Failed to save module order. Please try again.');
    }
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= reorderedModules.length) return;
    
    const newOrder = [...reorderedModules];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setReorderedModules(newOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {error || 'Failed to load course. Please try again.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Course Modules: {course.title}
        </h1>
        <div className="space-x-3">
          {reordering ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReorderSave}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Save className="inline-block w-4 h-4 mr-2" />
              Save Order
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setReordering(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Edit className="inline-block w-4 h-4 mr-2" />
              Reorder Modules
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModule(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Add Module
          </motion.button>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {reordering ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Reorder Modules
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag and drop modules to reorder them
              </p>
            </div>
            <div className="p-4">
              {reorderedModules.map((module, index) => (
                <div 
                  key={module.id}
                  className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-750 rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {index + 1}. {module.title}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveModule(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded-full ${
                        index === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900'
                      }`}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveModule(index, 'down')}
                      disabled={index === reorderedModules.length - 1}
                      className={`p-1 rounded-full ${
                        index === reorderedModules.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900'
                      }`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <button
                  onClick={() => setReordering(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mr-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReorderSave}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Save Order
                </button>
              </div>
            </div>
          </div>
        ) : (
          modules.length > 0 ? (
            modules.map(module => (
              <div 
                key={module.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleModuleExpand(module.id)}
                >
                  <div className="flex items-center">
                    {expandedModuleId === module.id ? 
                      <ChevronDown className="w-5 h-5 text-gray-500 mr-2" /> :
                      <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                    }
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {module.sequence_order}. {module.title}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModuleId(module.id);
                      }}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id);
                      }}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                
                {expandedModuleId === module.id && (
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                      <p className="text-gray-700 dark:text-gray-300">{module.description}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <a 
                        href={`/admin/course/${courseId}/module/${module.id}/lectures`}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        Manage Lectures
                      </a>
                      <a 
                        href={`/admin/course/${courseId}/module/${module.id}/project`}
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                      >
                        Manage Project
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                No Modules Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This course doesn't have any modules yet. Click the "Add Module" button to create your first module.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModule(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                <Plus className="inline-block w-5 h-5 mr-2" />
                Add Your First Module
              </motion.button>
            </div>
          )
        )}
      </div>

      {/* Add/Edit Module Modal */}
      {(showAddModule || editingModuleId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingModuleId ? 'Edit Module' : 'Add New Module'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModule(false);
                  setEditingModuleId(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <CourseModuleUploader 
              courseId={courseId || ''} 
              moduleId={editingModuleId} 
              onModuleAdded={handleModuleAdded}
              onModuleUpdated={handleModuleUpdated}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CourseModuleManager;
