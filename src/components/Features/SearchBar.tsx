import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface SearchResult {
  id: string;
  slug?: string;
  title: string;
  type: 'blog' | 'course';
  snippet: string;
}

// Add mobileButton, onClick, isModalOpen, onCloseModal props
interface SearchBarProps {
  mobileButton?: boolean;
  onClick?: () => void;
  isModalOpen?: boolean;
  onCloseModal?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ mobileButton, onClick, isModalOpen, onCloseModal }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { blogs, courses } = useApp();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    
    // Search blogs
    blogs.forEach(blog => {
      if (
        blog.title.toLowerCase().includes(query.toLowerCase()) ||
        blog.snippet.toLowerCase().includes(query.toLowerCase()) ||
        blog.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ) {
        searchResults.push({
          id: blog.id,
          slug: blog.slug, // add slug if available
          title: blog.title,
          type: 'blog',
          snippet: blog.snippet
        });
      }
    });

    // Search courses
    courses.forEach(course => {
      if (
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase()) ||
        course.category.toLowerCase().includes(query.toLowerCase())
      ) {
        searchResults.push({
          id: course.id,
          title: course.title,
          type: 'course',
          snippet: course.description
        });
      }
    });

    setResults(searchResults.slice(0, 6)); // Limit to 6 results
  }, [query, blogs, courses]);

  const handleClose = () => {
    if (onCloseModal) onCloseModal();
    setQuery('');
    setResults([]);
  };

  // Render mobile button with icon and text if mobileButton is true
  if (mobileButton) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
      >
        <Search className="w-5 h-5 mr-2" />
        <span>Search</span>
      </motion.button>
    );
  }

  // Only render button if onClick is provided
  if (onClick && !mobileButton) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="p-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors"
      >
        <Search className="w-5 h-5" />
      </motion.button>
    );
  }

  // Only render modal if isModalOpen is true
  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search blogs and courses..."
                  className="w-full pl-10 pr-12 py-3 border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-900 dark:text-white text-lg"
                  autoFocus
                />
                <button
                  onClick={handleClose}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Type at least 2 characters to search</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <div className="p-2">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      to={
                        result.type === 'blog'
                          ? `/blog/${result.slug || result.id}`
                          : `/course/${result.id}`
                      }
                      onClick={handleClose}
                      className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {result.type === 'blog' ? (
                            <BookOpen className="w-5 h-5 text-blue-500" />
                          ) : (
                            <GraduationCap className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {result.snippet}
                          </p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                            {result.type === 'blog' ? 'Blog' : 'Course'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchBar;