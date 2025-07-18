import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Tag, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicBlogViews } from '../../lib/useSupabase';
import BlogInteractions from './BlogInteractions';

interface BlogCardProps {
  blog: {
    id: string;
    slug: string;
    title: string;
    snippet: string;
    image: string;
    tags: string[];
    author: string;
    featured: boolean;
    created_at: string;
    views: number; // Added views to the interface
  };
  onEdit?: (blog: any) => void;
  onDelete?: (id: string) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onEdit, onDelete }) => {
  const { publicViews } = usePublicBlogViews();
  const getViewCount = (blogId: string) => {
    const blogViews = publicViews.find(view => view.blog_id === blogId);
    return blogViews?.views || 0;
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative h-full flex flex-col"
    >
      <Link to={`/blog/${blog.slug}`}>
        <div className="relative">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-48 object-cover"
          />
          {blog.featured && (
            <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
          )}
        </div>
      </Link>

      {/* Edit and Delete Icons - positioned on the card */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex space-x-1">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(blog);
              }}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Edit className="w-4 h-4" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(blog.id);
              }}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        <div className="flex flex-wrap gap-2 mb-3">
          {blog.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {blog.tags.length > 3 && (
            <span className="text-gray-500 text-xs">+{blog.tags.length - 3} more</span>
          )}
        </div>

        <Link to={`/blog/${blog.slug}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-orange-500 transition-colors line-clamp-2 h-14 overflow-hidden">
            {blog.title}
          </h3>
        </Link>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 h-10 overflow-hidden">
          {blog.snippet}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(blog.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-orange-500">
            <Eye className="w-4 h-4" />
            <span className="font-medium">{getViewCount(blog.id)} views</span>
          </div>
        </div>
        {/* Remove BlogInteractions for likes/comments count from BlogCard */}
      </div>
    </motion.div>
  );
};

export default BlogCard;