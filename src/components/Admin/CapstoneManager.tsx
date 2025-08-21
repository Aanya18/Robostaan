import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle, Check } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthProvider';
import { CourseCapstoneProject } from '../../lib/courseModuleTypes';
import {
  getCourseCapstoneProject,
  createCourseCapstoneProject,
  updateCourseCapstoneProject
} from '../../lib/courseModuleService';
import { getCourseById } from '../../lib/supabaseService';
import RichTextEditor from '../RichTextEditor/RichTextEditor';

const CapstoneManager: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAdmin } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [capstone, setCapstone] = useState<CourseCapstoneProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    requirements: '',
    resources_urls: [] as string[],
    submission_type: 'file' as 'file' | 'link' | 'text'
  });
  
  const [newResourceUrl, setNewResourceUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await getCourseById(courseId);
        
        if (courseError) throw new Error(`Failed to load course: ${courseError.message}`);
        if (!courseData) throw new Error('Course not found');
        
        setCourse(courseData);
        
        // Fetch capstone project for this course
        const { data: capstoneData, error: capstoneError } = await getCourseCapstoneProject(courseId);
        
        if (!capstoneError && capstoneData) {
          setCapstone(capstoneData);
          setFormData({
            title: capstoneData.title,
            description: capstoneData.description || '',
            instructions: capstoneData.instructions || '',
            requirements: capstoneData.requirements || '',
            resources_urls: capstoneData.resources_urls || [],
            submission_type: capstoneData.submission_type || 'file'
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleInstructionsChange = (content: string) => {
    setFormData(prev => ({ ...prev, instructions: content }));
  };
  
  const handleRequirementsChange = (content: string) => {
    setFormData(prev => ({ ...prev, requirements: content }));
  };
  
  const addResourceUrl = () => {
    if (!newResourceUrl.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      resources_urls: [...prev.resources_urls, newResourceUrl.trim()]
    }));
    setNewResourceUrl('');
  };
  
  const removeResourceUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources_urls: prev.resources_urls.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!formData.title.trim()) {
      setError('Capstone project title is required');
      return;
    }
    
    try {
      setSaving(true);
      
      if (capstone) {
        // Update existing capstone project
        const { data, error } = await updateCourseCapstoneProject(capstone.id, {
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          requirements: formData.requirements,
          resources_urls: formData.resources_urls,
          submission_type: formData.submission_type
        });
        
        if (error) throw error;
        
        setCapstone(data);
        setSuccess('Capstone project updated successfully!');
      } else {
        // Create new capstone project
        const { data, error } = await createCourseCapstoneProject({
          course_id: courseId || '',
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          requirements: formData.requirements,
          resources_urls: formData.resources_urls,
          submission_type: formData.submission_type
        });
        
        if (error) throw error;
        
        setCapstone(data);
        setSuccess('Capstone project created successfully!');
      }
    } catch (error) {
      console.error('Error saving capstone project:', error);
      setError('Failed to save capstone project. Please try again.');
    } finally {
      setSaving(false);
      
      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    }
  };

  if (loading && !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a 
          href={`/admin/course/${courseId}`}
          className="text-orange-500 hover:text-orange-600 transition-colors mb-4 inline-block"
        >
          &larr; Back to Course
        </a>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {capstone ? 'Edit Capstone Project' : 'Create Capstone Project'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {course?.title || 'Loading course...'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-200 dark:border-red-700 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-200 dark:border-green-700 rounded-md">
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}
      
      {/* Capstone Project Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter capstone project title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter project description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instructions
            </label>
            <RichTextEditor 
              value={formData.instructions} 
              onChange={handleInstructionsChange}
              placeholder="Enter detailed instructions for the capstone project..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Requirements
            </label>
            <RichTextEditor 
              value={formData.requirements} 
              onChange={handleRequirementsChange}
              placeholder="Enter specific requirements for the capstone project..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Submission Type
            </label>
            <select
              name="submission_type"
              value={formData.submission_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="file">File Upload</option>
              <option value="link">External Link</option>
              <option value="text">Text Submission</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select how students will submit their capstone project
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resources
            </label>
            
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newResourceUrl}
                onChange={(e) => setNewResourceUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter resource URL"
              />
              <button
                type="button"
                onClick={addResourceUrl}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.resources_urls.length > 0 ? (
              <ul className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-750">
                {formData.resources_urls.map((url, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 hover:underline truncate max-w-md"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeResourceUrl(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No resources added yet
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add links to helpful resources for this capstone project
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${
                saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  <span>{capstone ? 'Update Capstone Project' : 'Create Capstone Project'}</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CapstoneManager;
