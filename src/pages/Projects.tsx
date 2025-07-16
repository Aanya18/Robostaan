import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Code, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../components/Auth/AuthProvider';
import ProjectCard from '../components/ProjectCard/ProjectCard';
import ProjectModal from '../components/ProjectCard/ProjectModal';
import { useApp } from '../context/AppContext';
import JSZip from 'jszip';
import { getSupabase } from '../lib/supabaseConnection';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  category: string;
  technologies: string[];
  demoUrl?: string;
  sourceFiles: ProjectFile[];
  featured: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'code' | 'documentation' | 'asset' | 'config';
  content: string;
  size: number;
}

const Projects: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { projects, refreshProjects, loading, setProjects, addProject, updateProject, deleteProject } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const CATEGORY_LIMIT = 8;

  useEffect(() => {
    refreshProjects();
  }, []);

  // Add Project
  const handleAddProject = async (projectData: Partial<Project>) => {
    if (!isAdmin || !user) return;
    setProjects((prev) => prev); // trigger loading
    try {
      await addProject({
        ...projectData,
        owner_id: user.id,
        downloads: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setShowModal(false);
      setSelectedProject(null);
      setEditingProject(null);
      await refreshProjects();
    } catch (error) {
      setError('Failed to add project.');
    }
  };

  // Edit Project
  const handleEditProject = async (projectData: Partial<Project>) => {
    if (!editingProject || !user) return;
    if (editingProject.owner_id !== user.id) return;
    setProjects((prev) => prev); // trigger loading
    try {
      await updateProject(editingProject.id, {
        ...projectData,
        updated_at: new Date().toISOString(),
      });
      setShowModal(false);
      setSelectedProject(null);
      setEditingProject(null);
      await refreshProjects();
    } catch (error) {
      setError('Failed to update project.');
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project || !user) return;
    if (project.owner_id !== user.id) return;
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setProjects((prev) => prev); // trigger loading
    try {
      await deleteProject(id);
      await refreshProjects();
    } catch (error) {
      setError('Failed to delete project.');
    }
  };

  // Download ZIP handler (user's original approach)
  const handleDownloadZip = async (project: Project) => {
    try {
      const zip = new JSZip();
      // Add project files to ZIP
      project.sourceFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      // Add README with project info
      const readmeContent = `# ${project.title}

${project.tagline}

## Description
${project.description}

## Technologies Used
${project.technologies.join(', ')}

${project.demoUrl ? `## Demo\n${project.demoUrl}` : ''}

## Installation
1. Extract the ZIP file
2. Follow the setup instructions in the individual files
3. Install required dependencies

## License
This project is provided for educational purposes.

---
Downloaded from ROBOSTAAN Projects
`;
      zip.file('README.md', readmeContent);
      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      // Increment download count in DB (do not alert if this fails)
      try {
        const supabase = await getSupabase();
        // Only update the downloads field, do not send demoUrl or camelCase fields
        const { error } = await supabase.from('projects').update({ downloads: (project.downloads || 0) + 1 }).eq('id', project.id);
        if (!error) {
          setProjects(prev => prev.map(p => p.id === project.id ? { ...p, downloads: (p.downloads || 0) + 1 } : p));
        } else {
          console.error('Error updating download count:', error);
        }
      } catch (err) {
        console.error('Error updating download count:', err);
      }
    } catch (error) {
      console.error('Error creating ZIP file:', error, project);
      alert('Error creating download. Please try again.');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technologies.some((tech: string) => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || project.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for tag-style filter
  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

  // Generate structured data for project collection
  const projectCollectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Projects | " + siteConfig.name,
    "description": "Explore open-source robotics, AI, and automation projects.",
    "url": urlHelpers.fullUrl('/projects'),
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name,
      "logo": {
        "@type": "ImageObject",
        "url": urlHelpers.fullUrl(siteConfig.branding.logo.primary)
      }
    },
    "hasPart": projects.slice(0, 10).map((project: any) => ({
      "@type": "CreativeWork",
      "headline": project.title,
      "description": project.description,
      "image": urlHelpers.fullUrl(project.image),
      "author": {
        "@type": "Person",
        "name": project.author || 'Robostaan Team'
      },
      "datePublished": project.created_at,
      "keywords": Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies
    }))
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Our Projects | ROBOSTAAN"
        description="Explore open-source robotics, AI, and automation projects. Download source code, view demos, and contribute to the future of technology."
        keywords={["robotics projects", "AI projects", "automation", "open source", "technology", "STEM", "engineering", "source code", "demos"]}
        image={siteConfig.seo.defaultImage}
        url={urlHelpers.fullUrl('/projects')}
        type="website"
        structuredData={{
          ...projectCollectionStructuredData,
          name: "Our Projects"
        }}
        canonicalUrl={urlHelpers.fullUrl('/projects')}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900 py-6 px-2 sm:py-8 sm:px-4">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Projects
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore our collection of open-source projects. Download complete source code and learn from real-world implementations.
            </p>
          </motion.div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 sm:mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
              />
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingProject(null);
                  setSelectedProject({
                    id: '',
                    title: '',
                    tagline: '',
                    description: '',
                    image: '',
                    category: '',
                    technologies: [],
                    demoUrl: '',
                    sourceFiles: [],
                    featured: false,
                    downloads: 0,
                    created_at: '',
                    updated_at: '',
                    owner_id: ''
                  });
                  setShowModal(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </motion.button>
            )}
          </div>

          {/* Category Tag Filter (exact blog style) */}
          {categories.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by category:</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === ''
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </motion.button>
                {(showAllCategories ? categories : categories.slice(0, CATEGORY_LIMIT)).map((cat) => (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === cat
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
                {categories.length > CATEGORY_LIMIT && (
                  <button
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    {showAllCategories ? 'Show less' : `+${categories.length - CATEGORY_LIMIT} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="overflow-hidden rounded-lg shadow-sm bg-white dark:bg-gray-800"
              >
                <ProjectCard
                  project={project}
                  onDownload={handleDownloadZip}
                  onView={() => {
                    setSelectedProject(project);
                    setShowModal(true);
                  }}
                />
              </motion.div>
            ))}
          </div>

          {filteredProjects.length === 0 && !loading && (
            <div className="text-center py-12">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No projects found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search criteria or check back later for new projects.
              </p>
            </div>
          )}

          {/* Project Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2 sm:px-0">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 sm:p-8">
                <ProjectModal
                  project={selectedProject}
                  editingProject={editingProject}
                  onClose={() => {
                    setShowModal(false);
                    setSelectedProject(null);
                    setEditingProject(null);
                  }}
                  onSave={editingProject ? handleEditProject : handleAddProject}
                  onDownload={handleDownloadZip}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Projects; 