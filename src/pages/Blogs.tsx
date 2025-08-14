import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, X, Loader2 } from 'lucide-react';
import BlogCard from '../components/BlogCard/BlogCard';
import RichTextEditor from '../components/RichTextEditor/RichTextEditor';
import { useApp } from '../context/AppContext';
import { useAuth } from '../components/Auth/AuthProvider';
import { Blog } from '../lib/supabaseService';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';
import supabaseService from '../lib/supabaseService';

const Blogs: React.FC = () => {
  const { blogs: allBlogs, isAdmin, loading: appLoading, addBlog, updateBlog, deleteBlog, refreshData } = useApp();
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const TAG_LIMIT = 8;
  
  const postsPerPage = siteConfig.content.blog.postsPerPage || 12;
  const [displayedBlogs, setDisplayedBlogs] = useState<Blog[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    snippet: '',
    image: '',
    tags: '',
    author: '',
    featured: false
  });

  // Data is automatically loaded by AppContext, no need to refresh here

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedTag]);

  // Filter and paginate blogs when search, filter, or allBlogs change
  useEffect(() => {
    filterAndPaginateBlogs();
  }, [allBlogs, searchTerm, selectedTag, page]);

  // Load all tags for filter dropdown
  useEffect(() => {
    if (allBlogs.length > 0) {
      loadAllTags();
    }
  }, [allBlogs]);

  // Restore draft on mount (only for new blog creation, not editing)
  useEffect(() => {
    const savedDraft = localStorage.getItem('blogDraft');
    if (savedDraft && !editingBlog) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
      } catch (error) {
        console.error('Error parsing saved draft:', error);
        localStorage.removeItem('blogDraft');
      }
    }
  }, [editingBlog, showModal]);

  // Save draft on change (only for new blog creation, not editing)
  useEffect(() => {
    if (!editingBlog) {
      localStorage.setItem('blogDraft', JSON.stringify(formData));
    }
  }, [formData, editingBlog]);

  // Set author when profile is loaded
  useEffect(() => {
    if (profile && !editingBlog) {
      setFormData(prev => ({
        ...prev,
        author: profile.full_name || profile.email || ''
      }));
    }
  }, [profile, editingBlog]);

  // Reset form to initial state
  const resetForm = () => {
    const initialFormData = {
      title: '',
      content: '',
      snippet: '',
      image: '',
      tags: '',
      author: profile?.full_name || profile?.email || '',
      featured: false
    };
    setFormData(initialFormData);
    return initialFormData;
  };

  // Handle modal close
  const handleModalClose = () => {
    if (editingBlog) {
      // If we were editing, clear the form and remove from localStorage
      resetForm();
      localStorage.removeItem('blogDraft');
    }
    setShowModal(false);
    setEditingBlog(null);
  };

  // Handle opening modal for new blog
  const handleAddNew = () => {
    setEditingBlog(null);
    // Don't reset form immediately - let the user start typing and save as draft
    // Only reset if there's no existing draft
    const savedDraft = localStorage.getItem('blogDraft');
    if (!savedDraft) {
      resetForm();
    }
    setShowModal(true);
  };

  // Clear draft and start fresh
  const handleClearDraft = () => {
    localStorage.removeItem('blogDraft');
    resetForm();
  };

  const loadAllTags = async () => {
    try {
      // Extract all unique tags from blogs
      const allTagsSet = new Set<string>();
      allBlogs.forEach(blog => {
        if (blog.tags && Array.isArray(blog.tags)) {
          blog.tags.forEach(tag => {
            if (tag && tag.trim()) {
              allTagsSet.add(tag.trim());
            }
          });
        }
      });
      const tagsArray = Array.from(allTagsSet).sort();
      setAllTags(tagsArray);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const filterAndPaginateBlogs = () => {
    try {
      setLoading(true);
      setError(null);

      // Filter blogs based on search term and selected tag
      let filteredBlogs = allBlogs;

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredBlogs = filteredBlogs.filter(blog =>
          blog.title.toLowerCase().includes(searchLower) ||
          blog.content.toLowerCase().includes(searchLower) ||
          blog.snippet.toLowerCase().includes(searchLower)
        );
      }

      if (selectedTag) {
        filteredBlogs = filteredBlogs.filter(blog =>
          blog.tags.includes(selectedTag)
        );
      }

      // Paginate the filtered blogs
      const startIndex = 0;
      const endIndex = page * postsPerPage;
      const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex + postsPerPage);

      setDisplayedBlogs(paginatedBlogs);
      setHasMore(endIndex + postsPerPage < filteredBlogs.length);
    } catch (err) {
      console.error('Error filtering blogs:', err);
      setError('Failed to filter blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreBlogs = () => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
  };

  // Check if current user can edit/delete a blog
  const canManageBlog = (blog: Blog): boolean => {
    if (!user || !profile) return false;
    
    // Super admin can manage all blogs
    if (profile.role === 'admin' && profile.email === 'admin@robostaan.in') {
      return true;
    }
    
    // Regular users can only manage their own blogs
    const currentUserAuthor = profile.full_name || profile.email;
    return blog.author === currentUserAuthor;
  };

  function generateUniqueSlug(title: string, existingSlugs: string[]): string {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
    let slug = baseSlug;
    let counter = 2;
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let slug = '';
      if (!editingBlog) {
        const existingSlugs = allBlogs.map(b => b.slug);
        slug = generateUniqueSlug(formData.title, existingSlugs);
      } else {
        slug = editingBlog.slug;
      }
      const blogData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        author: profile?.full_name || profile?.email || formData.author,
        slug,
        views: editingBlog ? editingBlog.views : 0
      };

      if (editingBlog) {
        await updateBlog(editingBlog.id, blogData);
      } else {
        await addBlog(blogData);
      }

      // Clear draft on successful submit
      localStorage.removeItem('blogDraft');
      resetForm();
      setShowModal(false);
      setEditingBlog(null);
      
      // Reload blogs to show the new/updated blog
      refreshData();
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error saving blog. Please try again.');
    }
  };

  const handleEdit = (blog: Blog) => {
    if (!canManageBlog(blog)) {
      alert('You can only edit your own blogs.');
      return;
    }

    // Clear any existing draft when editing
    localStorage.removeItem('blogDraft');
    
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      snippet: blog.snippet,
      image: blog.image,
      tags: blog.tags.join(', '),
      author: blog.author,
      featured: blog.featured
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const blog = displayedBlogs.find((b: Blog) => b.id === id);
    if (!blog) return;

    if (!canManageBlog(blog)) {
      alert('You can only delete your own blogs.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteBlog(id);
        // Reload blogs to reflect the deletion
        refreshData();
      } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Error deleting blog. Please try again.');
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    refreshData();
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Generate structured data for blog collection
  const blogCollectionStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Robotics Blog Posts",
    "description": "Discover the latest insights, tutorials, and trends in robotics, AI, and automation technology.",
    "url": urlHelpers.fullUrl('/blogs'),
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name,
      "logo": {
        "@type": "ImageObject",
        "url": urlHelpers.fullUrl(siteConfig.branding.logo.primary)
      }
    },
    "hasPart": displayedBlogs.slice(0, 10).map((blog: Blog) => ({
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": blog.snippet,
      "image": urlHelpers.fullUrl(blog.image),
      "author": {
        "@type": "Person",
        "name": blog.author
      },
      "datePublished": blog.created_at,
      "url": urlHelpers.blogUrl(blog.slug)
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
        "name": "Blogs",
        "item": urlHelpers.fullUrl('/blogs')
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="Our Blogs | ROBOSTAAN"
        description="Discover the latest insights, tutorials, and trends in robotics, AI, and automation technology. Expert articles on programming, machine learning, and cutting-edge robotics."
        keywords={[
          'robotics blog', 'AI articles', 'automation tutorials', 'robotics programming',
          'machine learning', 'computer vision', 'IoT', 'drones', 'autonomous systems',
          'robotics education', 'STEM articles', 'technology insights'
        ]}
        image={siteConfig.seo.defaultImage}
        url={urlHelpers.fullUrl('/blogs')}
        type="website"
        structuredData={{
          ...blogCollectionStructuredData,
          name: "Our Blogs"
        }}
        canonicalUrl={urlHelpers.fullUrl('/blogs')}
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
              Our Blogs
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover the latest insights, tutorials, and trends from the world of robotics and automation
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
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {isAdmin && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Blog</span>
                </button>
              )}
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by tags:</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTag('')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedTag === ''
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </motion.button>
                  {(showAllTags ? allTags : allTags.slice(0, TAG_LIMIT)).map((tag) => (
                    <motion.button
                      key={tag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTag === tag
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </motion.button>
                  ))}
                  {allTags.length > TAG_LIMIT && (
                    <button
                      onClick={() => setShowAllTags((prev) => !prev)}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      {showAllTags ? 'Show less' : `+${allTags.length - TAG_LIMIT} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Blog Grid */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayedBlogs.map((blog: Blog, index: number) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <BlogCard 
                    blog={blog} 
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-8"
            >
              <button
                onClick={loadMoreBlogs}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Load More Blogs
              </button>
            </motion.div>
          )}

          {/* No Blogs Found */}
          {!loading && displayedBlogs.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No blogs found matching your criteria.
              </p>
            </motion.div>
          )}

          {/* End of Results */}
          {!loading && !hasMore && displayedBlogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-gray-500 dark:text-gray-400">
                You've reached the end of all blogs.
              </p>
            </motion.div>
          )}
        </div>

        {/* Add/Edit Blog Modal */}
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
                  {editingBlog ? 'Edit Blog' : 'Add New Blog'}
                </h2>
                <button
                  onClick={handleModalClose}
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
                    placeholder="Blog post title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Snippet
                  </label>
                  <input
                    type="text"
                    value={formData.snippet}
                    onChange={(e) => setFormData({ ...formData, snippet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brief description of the blog post"
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
                    placeholder="Write your blog content here..."
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Programming, AI, Robotics"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Featured Post
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {editingBlog ? 'Update Blog' : 'Add Blog'}
                  </button>
                  {!editingBlog && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear Draft
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleModalClose}
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

export default Blogs;