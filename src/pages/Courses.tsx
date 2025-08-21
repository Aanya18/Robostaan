import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, X, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import { cloudinaryService } from '../services/cloudinaryService';
import CourseCard from '../components/CourseCard/CourseCard';
import RichTextEditor from '../components/RichTextEditor/RichTextEditor';
import { useApp } from '../context/AppContext';
import { Course } from '../lib/supabaseService';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';
import { useNavigate } from 'react-router-dom';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isAdmin, loading, addCourse, updateCourse, deleteCourse, refreshData } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image: '',
    duration: '',
    category: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    video_url: '',
    materials: '',
    featured: false,
    coming_soon: false
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file type/size
    const validation = cloudinaryService.validateFile(file, 'image');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setUploadingImage(true);
      const result = await cloudinaryService.uploadFile(file, {
        resourceType: 'image',
        folder: 'courses',
        tags: ['course', 'cover']
      });

      // Update image field with uploaded URL
      setFormData(prev => ({ ...prev, image: result.secure_url }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const categories = ['Beginner', 'Intermediate', 'Advanced'];

  // Refresh data when component mounts or when navigating to this page
  useEffect(() => {
    refreshData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separate coming soon and available courses
  const comingSoonCourses = filteredCourses.filter(course => 
    course.title.toLowerCase().includes('coming soon') || 
    course.description.toLowerCase().includes('coming soon')
  );
  
  const availableCourses = filteredCourses.filter(course => 
    !course.title.toLowerCase().includes('coming soon') && 
    !course.description.toLowerCase().includes('coming soon')
  );

  // Show coming soon placeholder if no courses exist
  const showComingSoonPlaceholder = courses.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseData = {
        ...formData,
        materials: formData.materials.split(',').map(material => material.trim()).filter(material => material),
        // Add "Coming Soon" to title if marked as coming soon
        title: formData.coming_soon && !formData.title.toLowerCase().includes('coming soon') 
          ? `${formData.title} (Coming Soon)` 
          : formData.title
      };

      let newCourseId;
      if (editingCourse) {
        const { data } = await updateCourse(editingCourse.id, courseData);
        newCourseId = editingCourse.id;
      } else {
        const { data } = await addCourse(courseData);
        newCourseId = data?.id;
      }

      setFormData({
        title: '',
        description: '',
        content: '',
        image: '',
        duration: '',
        category: 'Beginner',
        video_url: '',
        materials: '',
        featured: false,
        coming_soon: false
      });
      setShowModal(false);
      setEditingCourse(null);
      
      // Redirect to module management page after successful course creation
      if (newCourseId && !formData.coming_soon) {
        navigate(`/admin/course/${newCourseId}/modules`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course. Please try again.');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    const isComingSoon = course.title.toLowerCase().includes('coming soon');
    setFormData({
      title: isComingSoon ? course.title.replace(/\s*\(coming soon\)/i, '') : course.title,
      description: course.description,
      content: course.content,
      image: course.image,
      duration: course.duration,
      category: course.category,
      video_url: course.video_url || '',
      materials: course.materials?.join(', ') || '',
      featured: course.featured,
      coming_soon: isComingSoon
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(id);
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Generate structured data for course collection
  const courseCollectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Robotics Courses",
    "description": "Master robotics with our comprehensive courses designed for all skill levels. Learn programming, AI, automation, and cutting-edge robotics technology.",
    "url": urlHelpers.fullUrl('/courses'),
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name,
      "logo": {
        "@type": "ImageObject",
        "url": urlHelpers.fullUrl(siteConfig.branding.logo.primary)
      }
    },
    "hasPart": availableCourses.slice(0, 10).map(course => ({
      "@type": "Course",
      "name": course.title,
      "description": course.description,
      "image": urlHelpers.fullUrl(course.image),
      "provider": {
        "@type": "Organization",
        "name": siteConfig.name,
        "sameAs": siteConfig.baseUrl
      },
      "courseMode": "online",
      "educationalLevel": course.category.toLowerCase(),
      "inLanguage": siteConfig.seo.language,
      "url": urlHelpers.courseUrl(course.id)
    }))
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteConfig.baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Courses",
        "item": urlHelpers.fullUrl('/courses')
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="Robotics Courses | ROBOSTAAN"
        description="Master robotics with our comprehensive courses designed for all skill levels. Learn programming, AI, automation, and cutting-edge robotics technology."
        keywords={[
          'robotics courses', 'robotics programming', 'AI courses', 'automation training',
          'machine learning', 'computer vision', 'IoT courses', 'drones', 'autonomous systems',
          'robotics education', 'STEM courses', 'engineering courses', 'online robotics'
        ]}
        image={siteConfig.seo.defaultImage}
        url={urlHelpers.fullUrl('/courses')}
        type="website"
        structuredData={courseCollectionStructuredData}
        canonicalUrl={urlHelpers.fullUrl('/courses')}
      />
      
      {/* Additional structured data for breadcrumbs */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbStructuredData)}
      </script>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Our Courses
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Master robotics with our comprehensive courses designed for all skill levels
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Levels</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Course</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Coming Soon Placeholder */}
          {(showComingSoonPlaceholder || availableCourses.length === 0) && (
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-12 text-center text-white"
              >
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold mb-4">Exciting Courses Coming Soon!</h2>
                  <p className="text-lg mb-6">
                    We're working hard to bring you the best robotics courses. Stay tuned for updates!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Beginner Level</h3>
                      <p className="text-sm">Perfect for those new to robotics</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Intermediate Level</h3>
                      <p className="text-sm">For those with some experience</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Advanced Level</h3>
                      <p className="text-sm">For experienced developers</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Available Courses */}
          {availableCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CourseCard 
                      course={course} 
                      onEdit={isAdmin ? handleEdit : undefined}
                      onDelete={isAdmin ? handleDelete : undefined}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Coming Soon Courses */}
          {comingSoonCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Coming Soon</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {comingSoonCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CourseCard 
                      course={course} 
                      onEdit={isAdmin ? handleEdit : undefined}
                      onDelete={isAdmin ? handleDelete : undefined}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Add/Edit Course Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Course title"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Brief description of the course"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="Write your course content here..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com/cover.png"
                    />

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Or Upload Image
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          id="course-image-upload"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="course-image-upload"
                          className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer flex items-center space-x-2 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          {uploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>{formData.image ? 'Change Image' : 'Upload Image'}</span>
                            </>
                          )}
                        </label>
                      </div>

                      {formData.image && (
                        <img src={formData.image} alt="Course cover" className="mt-2 w-full h-40 object-cover rounded" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., 8 weeks, 40 hours"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Video URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="YouTube or Vimeo URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Materials (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Arduino, Sensors, Software"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Featured Course
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="coming_soon"
                      checked={formData.coming_soon}
                      onChange={(e) => setFormData({ ...formData, coming_soon: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="coming_soon" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Coming Soon
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-60"
                    disabled={uploadingImage}
                  >
                    {editingCourse ? 'Update Course' : 'Add Course'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default Courses;