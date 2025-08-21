import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, X, Save } from 'lucide-react';
import { CourseModule } from '../../lib/courseModuleTypes';
import { 
  createCourseModule,
  updateCourseModule,
  getCourseModuleById
} from '../../lib/courseModuleService';

interface CourseModuleUploaderProps {
  courseId: string;
  moduleId: string | null;
  onModuleAdded: (module: CourseModule) => void;
  onModuleUpdated: (module: CourseModule) => void;
}

const CourseModuleUploader: React.FC<CourseModuleUploaderProps> = ({
  courseId,
  moduleId,
  onModuleAdded,
  onModuleUpdated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sequence_order: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If editing existing module, load its data
  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) return;
      
      try {
        setLoading(true);
        const { data, error } = await getCourseModuleById(moduleId);
        
        if (error) throw new Error(`Failed to load module: ${error.message}`);
        if (!data) throw new Error('Module not found');
        
        setFormData({
          title: data.title,
          description: data.description,
          sequence_order: data.sequence_order
        });
      } catch (err) {
        console.error('Error loading module:', err);
        setError(err instanceof Error ? err.message : 'Failed to load module');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sequence_order' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      
      if (!formData.title.trim()) {
        throw new Error('Module title is required');
      }
      
      if (moduleId) {
        // Update existing module
        const { data, error } = await updateCourseModule(moduleId, {
          title: formData.title,
          description: formData.description,
          sequence_order: formData.sequence_order
        });
        
        if (error) throw new Error(`Failed to update module: ${error.message}`);
        if (!data) throw new Error('Failed to update module: No data returned');
        
        onModuleUpdated(data);
      } else {
        // Create new module
        const { data, error } = await createCourseModule({
          course_id: courseId,
          title: formData.title,
          description: formData.description,
          sequence_order: formData.sequence_order
        });
        
        if (error) throw new Error(`Failed to create module: ${error.message}`);
        if (!data) throw new Error('Failed to create module: No data returned');
        
        onModuleAdded(data);
      }
    } catch (err) {
      console.error('Error saving module:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Module Title*
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Enter module title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Module Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Enter module description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sequence Order
        </label>
        <input
          type="number"
          name="sequence_order"
          value={formData.sequence_order}
          onChange={handleInputChange}
          min={1}
          className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Position of this module in the course sequence
        </p>
      </div>
      
      <div className="flex space-x-3 pt-4">
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : moduleId ? (
            <>
              <Save className="w-5 h-5" />
              <span>Update Module</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Create Module</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default CourseModuleUploader;
