import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { getSupabaseConnection } from '../../lib/supabaseConnection';
import { useAuth } from '../Auth/AuthProvider';
import { useLikeQueue } from '../../lib/useRequestQueue';

interface BlogInteractionsProps {
  blogId: string;
  blogSlug?: string;
  onCommentClick: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

const BlogInteractions: React.FC<BlogInteractionsProps> = ({ blogId, blogSlug, onCommentClick, refreshTrigger }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optimisticLike, setOptimisticLike] = useState<boolean | null>(null);
  const connection = getSupabaseConnection();
  const { queueLike, queueUnlike, status: queueStatus, isConnected } = useLikeQueue();

  // Debounced fetch to prevent excessive calls
  const debouncedFetch = useCallback(
    debounce(async () => {
      await fetchInteractionData();
    }, 300),
    []
  );

  // Immediate fetch for urgent updates (like after comment deletion)
  const immediateFetch = useCallback(async () => {
    console.log('⚡ BlogInteractions: Immediate fetch triggered');
    await fetchInteractionData();
  }, []);

  useEffect(() => {
    if (blogId) {
      console.log('🔄 BlogInteractions: Fetching data due to dependency change', { blogId, refreshTrigger });
      // Use immediate fetch when refreshTrigger changes to get latest data quickly
      if (refreshTrigger > 0) {
        immediateFetch();
      } else {
        fetchInteractionData();
      }
    }
  }, [blogId, user, refreshTrigger, immediateFetch]); // Add refreshTrigger to dependencies

  // Debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const fetchInteractionData = async () => {
    try {
      
      // Use main connection for authenticated operations to ensure proper RLS context
      const result = await connection.executeWithRetry(async (client) => {
        // Batch all queries together
        const [likesResult, userLikeResult, commentsResult] = await Promise.all([
          // Fetch like count
          client
            .from('blog_likes')
            .select('*', { count: 'exact', head: true })
            .eq('blog_id', blogId),
          
          // Check if user/anonymous liked this blog
          (() => {
            if (user) {
              return client
                .from('blog_likes')
                .select('id')
                .eq('blog_id', blogId)
                .eq('user_id', user.id)
                .maybeSingle();
            } else {
              // Check for anonymous user like
              const sessionId = localStorage.getItem('robostaan_blog_session_id');
              if (sessionId) {
                return client
                  .from('blog_likes')
                  .select('id')
                  .eq('blog_id', blogId)
                  .eq('user_id', `anonymous_${sessionId}`)
                  .maybeSingle();
              }
              return Promise.resolve({ data: null, error: null });
            }
          })(),
          
          // Fetch comment count
          client
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('blog_id', blogId)
        ]);

        return { likesResult, userLikeResult, commentsResult };
      });

      const { likesResult, userLikeResult, commentsResult } = result;

      // Update state with results
      setLikeCount(likesResult.count || 0);
      setLiked(!!userLikeResult.data);
      setCommentCount(commentsResult.count || 0);
      
      console.log('📊 BlogInteractions: Updated counts', {
        likes: likesResult.count || 0,
        comments: commentsResult.count || 0,
        userLiked: !!userLikeResult.data
      });

    } catch (error) {
      console.error('Error fetching interaction data:', error);
      // Don't throw error to prevent UI breaking
    }
  };

  const handleLike = async () => {
    if (loading) return;

    // Generate anonymous user ID if not logged in
    const userId = user?.id || `anonymous_${localStorage.getItem('robostaan_blog_session_id') || crypto.randomUUID()}`;
    
    // Store anonymous session ID for consistency
    if (!user && !localStorage.getItem('robostaan_blog_session_id')) {
      localStorage.setItem('robostaan_blog_session_id', userId.replace('anonymous_', ''));
    }

    // Optimistic update for better UX
    const previousLiked = liked;
    const previousCount = likeCount;
    
    setOptimisticLike(!liked);
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    setLoading(true);

    try {
      
      if (previousLiked) {
        // Unlike
        await queueUnlike(blogId, userId);
      } else {
        // Like
        await queueLike(blogId, userId);
      }

      setOptimisticLike(null); // Clear optimistic state
    } catch (error) {
      // Revert optimistic update on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setOptimisticLike(null);
      
      // Show user-friendly error
      if (error instanceof Error) {
        alert(`Failed to queue like operation: ${error.message}`);
      } else {
        alert('Failed to queue like operation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${blogSlug || blogId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this blog post',
          url: url
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // Refresh data periodically to keep counts accurate
  useEffect(() => {
    const interval = setInterval(() => {
      if (blogId && !loading) {
        console.log('⏱️ BlogInteractions: Periodic refresh');
        debouncedFetch();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [blogId, loading, debouncedFetch]);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Connection Status Indicator */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          {queueStatus.queueLength > 0 && (
            <span className="text-xs text-gray-500">
              {queueStatus.queueLength} pending
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
            liked || optimisticLike
              ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          } ${loading ? 'opacity-75' : ''}`}
        >
          <Heart className={`w-4 h-4 ${(liked || optimisticLike) ? 'fill-current' : ''}`} />
          <span className="text-sm">{likeCount}</span>
          {loading && (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1"></div>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCommentClick}
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{commentCount}</span>
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        className="flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm">Share</span>
      </motion.button>
    </div>
  );
};

export default BlogInteractions;