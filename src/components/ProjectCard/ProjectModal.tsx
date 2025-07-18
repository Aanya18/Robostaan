import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, Code, FileText, Upload, Plus, Trash2 } from 'lucide-react';
import { Project, ProjectFile } from '../../pages/Projects';
import JSZip from 'jszip';
import { useAuth } from '../Auth/AuthProvider';
import { useUserProfile } from '../../lib/useSupabase';

interface ProjectModalProps {
  project: Project | null;
  editingProject: Project | null;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  onDownload?: (project: Project) => void;
}

const ADD_PROJECT_DRAFT_KEY = 'robostaan_add_project_draft';

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  editingProject,
  onClose,
  onSave,
  onDownload
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(!!editingProject);
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    image: '',
    category: '',
    technologies: '',
    demoUrl: '',
    featured: false
  });
  const [sourceFiles, setSourceFiles] = useState<ProjectFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft from localStorage if adding new project
  useEffect(() => {
    if (!editingProject && project && project.id === '') {
      const draft = localStorage.getItem(ADD_PROJECT_DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed.formData || formData);
          setSourceFiles(parsed.sourceFiles || []);
        } catch {}
      }
    }
  }, [editingProject, project]);

  // Save draft to localStorage on change (only for add new)
  useEffect(() => {
    if (!editingProject && project && project.id === '') {
      localStorage.setItem(
        ADD_PROJECT_DRAFT_KEY,
        JSON.stringify({ formData, sourceFiles })
      );
    }
  }, [formData, sourceFiles, editingProject, project]);

  // Clear draft on save or cancel (only for add new)
  const clearDraft = () => {
    if (!editingProject && project && project.id === '') {
      localStorage.removeItem(ADD_PROJECT_DRAFT_KEY);
    }
  };

  useEffect(() => {
    // If both project and editingProject are null or project.id is empty, treat as add new project
    if ((!editingProject && (!project || project.id === '')) && !isEditing) {
      setIsEditing(true);
      setFormData({
        title: '',
        tagline: '',
        description: '',
        image: '',
        category: '',
        technologies: '',
        demoUrl: '',
        featured: false
      });
      setSourceFiles([]);
    } else if (editingProject || project) {
      const currentProject = editingProject || project;
      if (currentProject) {
        setFormData({
          title: currentProject.title,
          tagline: currentProject.tagline,
          description: currentProject.description,
          image: currentProject.image,
          category: currentProject.category,
          technologies: currentProject.technologies.join(', '),
          demoUrl: currentProject.demoUrl || '',
          featured: currentProject.featured
        });
        setSourceFiles([...currentProject.sourceFiles]);
      }
    }
  }, [project, editingProject]);

  const handleSave = () => {
    const projectData = {
      ...formData,
      technologies: formData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
      sourceFiles,
      updated_at: new Date().toISOString()
    };
    onSave(projectData);
    clearDraft();
  };

  const addNewFile = () => {
    const newFile: ProjectFile = {
      id: Date.now().toString(),
      name: 'new_file.txt',
      type: 'code',
      content: '// Add your code here',
      size: 0
    };
    setSourceFiles([...sourceFiles, newFile]);
    setSelectedFileIndex(sourceFiles.length);
  };

  const updateFile = (index: number, updates: Partial<ProjectFile>) => {
    const updatedFiles = [...sourceFiles];
    updatedFiles[index] = { ...updatedFiles[index], ...updates };
    if (updates.content) {
      updatedFiles[index].size = new Blob([updates.content]).size;
    }
    setSourceFiles(updatedFiles);
  };

  const deleteFile = (index: number) => {
    const updatedFiles = sourceFiles.filter((_, i) => i !== index);
    setSourceFiles(updatedFiles);
    if (selectedFileIndex >= updatedFiles.length) {
      setSelectedFileIndex(Math.max(0, updatedFiles.length - 1));
    }
  };

  const getFileIcon = (type: ProjectFile['type']) => {
    switch (type) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'asset': return <Upload className="w-4 h-4" />;
      case 'config': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const currentProject = editingProject || project!;
  // Fetch owner's profile
  const { profile: ownerProfile } = useUserProfile(currentProject?.owner_id || '', !isEditing && !!currentProject?.owner_id);

  // Add categoryColors, hashStringToColorIndex, and getCategoryColor for badge styling
  const categoryColors = [
    'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
    'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
    'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
    'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
  ];
  function hashStringToColorIndex(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % categoryColors.length;
  }
  const getCategoryColor = (category: string) => {
    return categoryColors[hashStringToColorIndex(category)];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl sm:max-w-3xl lg:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
                {isEditing ? (editingProject ? 'Edit Project' : 'Add New Project') : currentProject.title}
              </h2>
              {/* Show category badge if not editing */}
              {!isEditing && currentProject.category && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ml-0 sm:ml-2 mt-2 sm:mt-0 ${getCategoryColor(currentProject.category)}`}>
                  {currentProject.category}
                </span>
              )}
              {/* Show owner/author if not editing */}
              {/* Removed author display as per user request */}
              {!isEditing && (
                <div className="flex flex-wrap items-center space-x-2">
                  {onDownload && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDownload(currentProject)}
                      className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download ZIP</span>
                    </motion.button>
                  )}
                  {currentProject.demoUrl && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(currentProject.demoUrl, '_blank')}
                      className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Demo</span>
                    </motion.button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="hidden lg:flex text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[calc(95vh-64px)]">
            {isEditing ? (
              <div className="h-full flex flex-col lg:flex-row max-h-[calc(95vh-64px)]">
                {/* Form Section */}
                <div className="flex-1 min-w-[220px] p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-64px)] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Technologies (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.technologies}
                        onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        placeholder="React, Node.js, MongoDB"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Demo URL (optional)
                      </label>
                      <input
                        type="url"
                        value={formData.demoUrl}
                        onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      />
                      {/* Mobile-only upload button (simple, static, below Demo URL) */}
                      <div className="lg:hidden mt-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium mt-0"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          <span>Upload File</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.md,.txt,.json,.html,.css,.doc,.docx,.pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const content = event.target?.result as string;
                                const newFile = {
                                  id: Date.now().toString(),
                                  name: file.name,
                                  type: 'code' as ProjectFile['type'],
                                  content,
                                  size: file.size
                                };
                                setSourceFiles((prev) => [...prev, newFile]);
                              };
                              reader.readAsText(file);
                            }
                            // Reset input so same file can be uploaded again if needed
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>

                    {/* Uploaded files list (mobile only) */}
                    {sourceFiles.length > 0 && (
                      <div className="lg:hidden mt-4 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Uploaded Files</h4>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          {sourceFiles.map((file, idx) => (
                            <li key={file.id} className="flex items-center justify-between px-3 py-2">
                              <span className="truncate text-xs sm:text-sm text-gray-800 dark:text-gray-200">{file.name}</span>
                              <button
                                onClick={() => {
                                  setSourceFiles(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">
                        Featured Project
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
                      >
                        {editingProject ? 'Update Project' : 'Create Project'}
                      </motion.button>
                      <button
                        onClick={() => {
                          if (!editingProject && (!project || project.id === '')) {
                            clearDraft();
                            onClose();
                          } else {
                            setIsEditing(false);
                          }
                        }}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Management Section: hidden on mobile, visible on lg+ */}
                <div className="hidden lg:flex-1 lg:flex min-w-[220px] flex-col overflow-y-auto max-h-[calc(95vh-64px)] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Source Files
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addNewFile}
                        className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add File</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex-1 flex">
                    {/* File List */}
                    <div className="w-32 sm:w-48 min-w-[100px] sm:min-w-[120px] max-w-[160px] sm:max-w-[200px] border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                      {sourceFiles.map((file, index) => (
                        <div
                          key={file.id}
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedFileIndex === index ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                          }`}
                          onClick={() => setSelectedFileIndex(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getFileIcon(file.type)}
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(index);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* File Editor */}
                    <div className="flex-1 flex flex-col">
                      {sourceFiles[selectedFileIndex] && (
                        <>
                          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={sourceFiles[selectedFileIndex].name}
                                onChange={(e) => updateFile(selectedFileIndex, { name: e.target.value })}
                                className="px-2 py-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <select
                                value={sourceFiles[selectedFileIndex].type}
                                onChange={(e) => updateFile(selectedFileIndex, { type: e.target.value as ProjectFile['type'] })}
                                className="px-2 py-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="code">code</option>
                                <option value="documentation">documentation</option>
                                <option value="asset">asset</option>
                                <option value="config">config</option>
                              </select>
                            </div>
                          </div>
                          <textarea
                            value={sourceFiles[selectedFileIndex].content}
                            onChange={(e) => updateFile(selectedFileIndex, { content: e.target.value })}
                            className="flex-1 p-2 sm:p-3 font-mono text-xs sm:text-sm border-0 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            placeholder="Enter file content..."
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="h-full flex flex-col lg:flex-row max-h-[calc(95vh-64px)]">
                {/* Project Info */}
                <div className="flex-1 min-w-[220px] p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-64px)] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
                  <img
                    src={currentProject.image}
                    alt={currentProject.title}
                    className="w-full h-40 sm:h-48 object-cover rounded-lg mb-4"
                  />
                  <p className="text-orange-500 font-medium mb-2 break-words">{currentProject.tagline}</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 break-words">{currentProject.description}</p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentProject.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-orange-500">{currentProject.downloads?.toLocaleString?.() ?? 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Downloads</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-500">{(currentProject.sourceFiles?.length ?? 0)}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Files</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* File Viewer: hidden on mobile, visible on lg+ */}
                <div className="hidden lg:flex flex-1 min-w-[220px] flex-col overflow-y-auto max-h-[calc(95vh-64px)] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Source Files {(currentProject.sourceFiles?.length ?? 0)}
                    </h3>
                  </div>
                  <div className="flex-1 flex">
                    {/* File List */}
                    <div className="w-32 sm:w-48 min-w-[100px] sm:min-w-[120px] max-w-[160px] sm:max-w-[200px] border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                      {(currentProject.sourceFiles || []).map((file, index) => (
                        <div
                          key={file.id}
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedFileIndex === index ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                          }`}
                          onClick={() => setSelectedFileIndex(index)}
                        >
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file.type)}
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </span>
                            </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* File Content */}
                    <div className="flex-1 flex flex-col">
                      {(currentProject.sourceFiles || [])[selectedFileIndex] && (
                        <>
                          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                {(currentProject.sourceFiles || [])[selectedFileIndex].name}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {(currentProject.sourceFiles || [])[selectedFileIndex].type}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-auto">
                            <pre className="p-2 sm:p-4 text-xs sm:text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {(currentProject.sourceFiles || [])[selectedFileIndex].content}
                            </pre>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Mobile-only action bar (stacked vertically) */}
                <div className="lg:hidden flex flex-col gap-y-2 py-3 px-2 mt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {onDownload && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDownload(currentProject)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download ZIP</span>
                    </motion.button>
                  )}
                  {currentProject.demoUrl && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(currentProject.demoUrl, '_blank')}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Demo</span>
                    </motion.button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectModal; 