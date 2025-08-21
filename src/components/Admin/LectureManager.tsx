import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, ChevronDown, ChevronRight, Save, Upload, File } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthProvider';
import { 
  ModuleLecture,
  LectureAttachment
} from '../../lib/courseModuleTypes';

import {
  getModuleLectures, 
  getModuleLectureById,
  createModuleLecture,
  updateModuleLecture,
  deleteModuleLecture,
  getCourseModuleById,
  createLectureAttachment
} from '../../lib/courseModuleService';
import { cloudinaryService } from '../../services/cloudinaryService';
import RichTextEditor from '../RichTextEditor/RichTextEditor';

const LectureManager: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const { isAdmin } = useAuth();
  
  const [module, setModule] = useState<any>(null);
  const [lectures, setLectures] = useState<ModuleLecture[]>([]);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState<string | null>(null);
  const [expandedLectureId, setExpandedLectureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingSlides, setUploadingSlides] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    sequence_order: 1,
    video_url: '',
    slides_url: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!moduleId) return;
      
      try {
        setLoading(true);
        
        // Fetch module details
        const { data: moduleData, error: moduleError } = await getCourseModuleById(moduleId);
        
        if (moduleError) throw new Error(`Failed to load module: ${moduleError.message}`);
        if (!moduleData) throw new Error('Module not found');
        
        setModule(moduleData);
        
        // Fetch lectures for this module
        const { data: lecturesData, error: lecturesError } = await getModuleLectures(moduleId);
        
        if (lecturesError) throw new Error(`Failed to load lectures: ${lecturesError.message}`);
        
        setLectures(lecturesData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [moduleId]);
  
  useEffect(() => {
    const fetchLectureData = async () => {
      if (!editingLectureId) {
        setFormData({
          title: '',
          description: '',
          content: '',
          duration: '',
          sequence_order: lectures.length + 1,
          video_url: '',
          slides_url: ''
        });
        return;
      }
      
      try {
        const { data, error } = await getModuleLectureById(editingLectureId);
        
        if (error) throw error;
        if (!data) throw new Error('Lecture not found');
        
        setFormData({
          title: data.title,
          description: data.description || '',
          content: data.content || '',
          duration: data.duration || '',
          sequence_order: data.sequence_order,
          video_url: data.video_url || '',
          slides_url: data.slides_url || ''
        });
      } catch (err) {
        console.error('Error loading lecture data:', err);
        alert('Failed to load lecture data');
      }
    };
    
    fetchLectureData();
  }, [editingLectureId, lectures.length]);
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sequence_order' ? parseInt(value) || 1 : value
    }));
  };
  
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };
  
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file
    const validation = cloudinaryService.validateFile(file, 'video');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    try {
      setUploadingVideo(true);
      
      // Upload video to Cloudinary
      const result = await cloudinaryService.uploadFile(file, {
        resourceType: 'video',
        folder: `courses/${moduleId}/lectures`,
        tags: ['course', 'lecture', 'video']
      });
      
      // Update form data with video URL
      setFormData(prev => ({ 
        ...prev, 
        video_url: result.secure_url 
      }));
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };
  
  const handleSlidesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file
    const validation = cloudinaryService.validateFile(file, 'document');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    try {
      setUploadingSlides(true);
      
      // Upload slides to Cloudinary
      const result = await cloudinaryService.uploadFile(file, {
        resourceType: 'raw',
        folder: `courses/${moduleId}/lectures`,
        tags: ['course', 'lecture', 'slides']
      });
      
      // Update form data with slides URL
      setFormData(prev => ({ 
        ...prev, 
        slides_url: result.secure_url 
      }));
    } catch (error) {
      console.error('Error uploading slides:', error);
      alert('Failed to upload slides. Please try again.');
    } finally {
      setUploadingSlides(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Lecture title is required');
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingLectureId) {
        // Update existing lecture
        const { data, error } = await updateModuleLecture(editingLectureId, {
          title: formData.title,
          description: formData.description,
          content: formData.content,
          duration: formData.duration,
          sequence_order: formData.sequence_order,
          video_url: formData.video_url,
          slides_url: formData.slides_url
        });
        
        if (error) throw error;
        
        // Update lectures list
        setLectures(prev => prev.map(l => l.id === editingLectureId ? data! : l));
      } else {
        // Create new lecture
        const { data, error } = await createModuleLecture({
          module_id: moduleId || '',
          title: formData.title,
          description: formData.description,
          content: formData.content,
          duration: formData.duration,
          sequence_order: formData.sequence_order,
          video_url: formData.video_url,
          slides_url: formData.slides_url
        });
        
        if (error) throw error;
        
        // Create attachments if files were uploaded
        if (data) {
          const lectureId = data.id;
          
          // Create video attachment if provided
          if (formData.video_url) {
            await createLectureAttachment({
              lecture_id: lectureId,
              title: `${data.title} - Video`,
              description: `Video for ${data.title}`,
              attachment_url: formData.video_url,
              cloudinary_public_id: `courses/${moduleId}/lectures/${lectureId}/video`,
              attachment_type: 'video'
            });
          }
          
          // Create slides attachment if provided
          if (formData.slides_url) {
            await createLectureAttachment({
              lecture_id: lectureId,
              title: `${data.title} - Slides`,
              description: `Slides for ${data.title}`,
              attachment_url: formData.slides_url,
              cloudinary_public_id: `courses/${moduleId}/lectures/${lectureId}/slides`,
              attachment_type: 'slides'
            });
          }
          
          // Update lectures list
          setLectures(prev => [...prev, data]);
        }
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        content: '',
        duration: '',
        sequence_order: lectures.length + 1,
        video_url: '',
        slides_url: ''
      });
      setEditingLectureId(null);
      setShowAddLecture(false);
    } catch (error) {
      console.error('Error saving lecture:', error);
      alert('Failed to save lecture. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteLecture = async (lectureId: string) => {
    if (window.confirm('Are you sure you want to delete this lecture? This will also delete any associated quizzes and attachments.')) {
      try {
        const { error } = await deleteModuleLecture(lectureId);
        
        if (error) throw error;
        
        // Update lectures list
        setLectures(prev => prev.filter(l => l.id !== lectureId));
      } catch (error) {
        console.error('Error deleting lecture:', error);
        alert('Failed to delete lecture. Please try again.');
      }
    }
  };
  
  const toggleLectureExpand = (lectureId: string) => {
    setExpandedLectureId(expandedLectureId === lectureId ? null : lectureId);
  };

  if (loading && !lectures.length) {
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
          href={`/admin/course/${courseId}/modules`}
          className="text-orange-500 hover:text-orange-600 transition-colors mb-4 inline-block"
        >
          &larr; Back to Course Modules
        </a>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Lectures
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {module?.title || 'Loading module...'}
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddLecture(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Add Lecture
          </motion.button>
        </div>
      </div>
      
      {/* Lectures List */}
      <div className="space-y-4">
        {lectures.length > 0 ? (
          lectures
            .sort((a, b) => a.sequence_order - b.sequence_order)
            .map(lecture => (
            <div 
              key={lecture.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div 
                className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer"
                onClick={() => toggleLectureExpand(lecture.id)}
              >
                <div className="flex items-center">
                  {expandedLectureId === lecture.id ? 
                    <ChevronDown className="w-5 h-5 text-gray-500 mr-2" /> :
                    <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                  }
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {lecture.sequence_order}. {lecture.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lecture.duration || 'No duration set'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLectureId(lecture.id);
                      setShowAddLecture(true);
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
                      handleDeleteLecture(lecture.id);
                    }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              
              {expandedLectureId === lecture.id && (
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-gray-700 dark:text-gray-300">{lecture.description || 'No description'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Video</h4>
                      {lecture.video_url ? (
                        <div className="aspect-w-16 aspect-h-9">
                          <video 
                            src={lecture.video_url} 
                            controls 
                            className="rounded-md object-cover w-full h-48"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No video uploaded</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Slides</h4>
                      {lecture.slides_url ? (
                        <a 
                          href={lecture.slides_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <File className="w-4 h-4 mr-2" />
                          View Slides
                        </a>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No slides uploaded</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-4">
                    <a 
                      href={`/admin/course/${courseId}/module/${moduleId}/lecture/${lecture.id}/quiz`}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      Manage Quiz
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              No Lectures Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This module doesn't have any lectures yet. Click the "Add Lecture" button to create your first lecture.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddLecture(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus className="inline-block w-5 h-5 mr-2" />
              Add Your First Lecture
            </motion.button>
          </div>
        )}
      </div>
      
      {/* Add/Edit Lecture Modal */}
      {showAddLecture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingLectureId ? 'Edit Lecture' : 'Add New Lecture'}
              </h2>
              <button
                onClick={() => {
                  setShowAddLecture(false);
                  setEditingLectureId(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lecture Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter lecture title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 45 minutes"
                  />
                </div>
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
                  placeholder="Enter lecture description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <RichTextEditor 
                  value={formData.content} 
                  onChange={handleContentChange} 
                  placeholder="Enter lecture content..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload Video
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      accept="video/*"
                      id="video-upload"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={uploadingVideo}
                    />
                    <label
                      htmlFor="video-upload"
                      className={`flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                        uploadingVideo
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      {uploadingVideo ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          <span>{formData.video_url ? 'Change Video' : 'Upload Video'}</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {formData.video_url && (
                    <div className="mt-2">
                      <p className="text-sm text-green-500">Video uploaded successfully</p>
                      <video 
                        src={formData.video_url} 
                        controls 
                        className="mt-2 rounded-md max-h-32" 
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload Slides
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      id="slides-upload"
                      onChange={handleSlidesUpload}
                      className="hidden"
                      disabled={uploadingSlides}
                    />
                    <label
                      htmlFor="slides-upload"
                      className={`flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                        uploadingSlides
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      {uploadingSlides ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          <span>{formData.slides_url ? 'Change Slides' : 'Upload Slides'}</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {formData.slides_url && (
                    <div className="mt-2">
                      <p className="text-sm text-green-500">Slides uploaded successfully</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{formData.slides_url}</p>
                    </div>
                  )}
                </div>
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
                  Position of this lecture in the module sequence
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowAddLecture(false);
                    setEditingLectureId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading || uploadingVideo || uploadingSlides}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${
                    loading || uploadingVideo || uploadingSlides ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : editingLectureId ? (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Update Lecture</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Create Lecture</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LectureManager;
