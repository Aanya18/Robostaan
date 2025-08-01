import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Tag, ArrowLeft, Share2, BookOpen, MessageCircle, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CommentSection from '../components/Comments/CommentSection';
import BlogInteractions from '../components/BlogCard/BlogInteractions';
import SEOHead from '../components/SEO/SEOHead';
import { generateBlogStructuredData, generateBreadcrumbStructuredData } from '../utils/seoUtils';
import { siteConfig, urlHelpers } from '../config/siteConfig';
import supabaseService from '../lib/supabaseService';
import { usePublicBlogViews } from '../lib/useSupabase';
import { useAuth } from '../components/Auth/AuthProvider';
import QuillContent from '../components/RichTextEditor/QuillContent';

type Blog = {
  id: string;
  slug: string;
  title: string;
  content: string;
  snippet: string;
  image: string;
  tags: string[];
  author: string;
  featured: boolean;
  created_at: string;
  updated_at?: string;
  views: number;
};

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogs, loading } = useApp();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger state
  const { publicViews, refetch: refetchViews } = usePublicBlogViews();
  const { user } = useAuth();

  useEffect(() => {
    if (slug && blogs.length > 0) {
      const foundBlog = blogs.find(b => b.slug === slug);
      setBlog(foundBlog || null);
      if (foundBlog) {
        // Unique view logic
        let sessionId = localStorage.getItem('robostaan_blog_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          localStorage.setItem('robostaan_blog_session_id', sessionId);
        }
        supabaseService.incrementBlogViews(foundBlog.id, user?.id, user ? undefined : sessionId);
      }
    }
  }, [slug, blogs, user]);

  // Record blog view when component mounts (only once per session)
  useEffect(() => {
    if (blog?.id && !viewRecorded) {
      const recordView = async () => {
        try {
          const result = await supabaseService.recordBlogView(blog.id, {
            viewerIp: 'client-side',
            viewerUserAgent: navigator.userAgent
          });
          
          if (result.error) {
            console.error('Error recording blog view:', result.error);
          } else {
            console.log('Blog view recorded successfully for:', blog.id);
            setViewRecorded(true);
            // Refetch views to update the count
            refetchViews();
          }
        } catch (error) {
          console.error('Error recording blog view:', error);
        }
      };
      
      recordView();
    }
  }, [blog?.id, viewRecorded, refetchViews]);

  // Get view count for this blog
  const getViewCount = (blogId: string) => {
    const blogViews = publicViews.find(view => view.blog_id === blogId);
    return blogViews?.views || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Blog Post Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/blogs"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blogs</span>
          </Link>
        </div>
      </div>
    );
  }

  // Generate SEO data for this blog post
  const blogUrl = urlHelpers.blogUrl(blog.slug);
  const blogStructuredData = generateBlogStructuredData({
    ...blog,
    url: blogUrl
  });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: siteConfig.baseUrl },
    { name: 'Blogs', url: urlHelpers.fullUrl('/blogs') },
    { name: blog.title, url: blogUrl }
  ]);

  // Extract keywords from blog content
  const keywords = [
    'robotics', 'blog', 'tutorial', 'technology', 'programming',
    'AI', 'automation', 'education', 'STEM', ...blog.tags
  ];

  // Social sharing functions
  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check out this amazing blog post: ${blog.title}`);
    const url = encodeURIComponent(blogUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(blogUrl);
    const title = encodeURIComponent(blog.title);
    const summary = encodeURIComponent(blog.snippet);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(blogUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <>
      <SEOHead
        title={blog.title}
        description={blog.snippet}
        keywords={keywords}
        image={blog.image}
        url={blogUrl}
        type="article"
        author={blog.author}
        publishedTime={blog.created_at}
        modifiedTime={blog.updated_at}
        tags={blog.tags}
        structuredData={blogStructuredData}
        canonicalUrl={blogUrl}
      />
      
      {/* Additional structured data for breadcrumbs */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbStructuredData)}
      </script>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Back Button */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link
            to="/blogs"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blogs</span>
          </Link>
        </div>

        {/* Blog Header */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(blog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>{Math.ceil(blog.content.split(' ').length / 200)} min read</span>
              </div>
              <div className="flex items-center space-x-2 text-orange-500">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{getViewCount(blog.id)} views</span>
              </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Social Share Buttons */}
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-sm text-gray-600 dark:text-gray-300">Share:</span>
              <button
                onClick={shareOnTwitter}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                aria-label="Share on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button
                onClick={shareOnFacebook}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Share on Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Featured Image */}
          {blog.image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </motion.div>
          )}

          {/* Blog Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <QuillContent 
              content={blog.content}
              className="prose prose-lg max-w-none"
            />
          </motion.div>

          {/* Author Bio */}
          {/*
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              About the Author
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {blog.author} is a passionate robotics enthusiast and educator dedicated to sharing knowledge 
              about the latest developments in robotics, AI, and automation technology.
            </p>
          </motion.div>
          */}

          {/* Blog Interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8"
          >
            <BlogInteractions 
              blogId={blog.id} 
              blogSlug={blog.slug}
              onCommentClick={() => setShowComments(true)}
              refreshTrigger={refreshTrigger}
            />
          </motion.div>
        </article>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        >
          {/* Comment Section Modal */}
          <CommentSection 
            blogId={blog.id} 
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        </motion.div>
      </div>
    </>
  );
};

export default BlogDetail;