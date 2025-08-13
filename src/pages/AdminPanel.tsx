import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getSupabaseConnection } from '../lib/supabaseConnection';
import { useAuth } from '../components/Auth/AuthProvider';
import { Navigate } from 'react-router-dom';

interface AnalyticsData {
  totalUsers: number;
  totalBlogs: number;
  totalCourses: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  recentActivity: any[];
  popularBlogs: any[];
  userGrowth: any[];
  usersChange: number;
  blogsChange: number;
  coursesChange: number;
  likesChange: number;
  commentsChange: number;
  viewsChange: number;
}

const AdminPanel: React.FC = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalBlogs: 0,
    totalCourses: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    recentActivity: [],
    popularBlogs: [],
    userGrowth: [],
    usersChange: 0,
    blogsChange: 0,
    coursesChange: 0,
    likesChange: 0,
    commentsChange: 0,
    viewsChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const connection = getSupabaseConnection();

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const getDateNDaysAgo = (n: number): string => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString();
      };

      // Get admin's profile to find their full name for blog ownership
      const { data: userProfile } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
      });

      // Get blogs owned by this admin using user_id
      const { data: userBlogs } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('blogs')
          .select('id, title, user_id, author, created_at, views, blog_likes (count)')
          .eq('user_id', user.id);
      });

      const userBlogIds = userBlogs?.map(blog => blog.id) || [];

      // Calculate total views by summing the views column
      const totalViews = userBlogs?.reduce((sum, blog) => sum + (blog.views || 0), 0) || 0;

      // For popular blogs, sort by views
      const blogsWithViews = (userBlogs || []).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

      // Use the connection manager for all database operations
      const [
        { count: totalUsers },
        { count: totalBlogs },
        { count: totalCourses },
        { count: totalLikes },
        { count: totalComments },
        { count: usersCurrent },
        { count: usersPrevious },
        { count: blogsCurrent },
        { count: blogsPrevious },
        { count: coursesCurrent },
        { count: coursesPrevious },
        { count: likesCurrent },
        { count: likesPrevious },
        { count: commentsCurrent },
        { count: commentsPrevious },
      ] = await Promise.all([
        connection.executeWithRetry(async (client) => client.from('user_profiles').select('*', { count: 'exact', head: true })),
        connection.executeWithRetry(async (client) => client.from('blogs').select('*', { count: 'exact', head: true }).eq('user_id', user.id)),
        connection.executeWithRetry(async (client) => client.from('courses').select('*', { count: 'exact', head: true }).eq('author', userProfile?.full_name || '')),
        connection.executeWithRetry(async (client) => client.from('blog_likes').select('*', { count: 'exact', head: true }).in('blog_id', userBlogIds)),
        connection.executeWithRetry(async (client) => client.from('comments').select('*', { count: 'exact', head: true }).in('blog_id', userBlogIds)),
        connection.executeWithRetry(async (client) => client.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', getDateNDaysAgo(14)).lt('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('blogs').select('*', { count: 'exact', head: true }).eq('author', userProfile?.full_name || '').gte('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('blogs').select('*', { count: 'exact', head: true }).eq('author', userProfile?.full_name || '').gte('created_at', getDateNDaysAgo(14)).lt('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('courses').select('*', { count: 'exact', head: true }).eq('author', userProfile?.full_name || '').gte('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('courses').select('*', { count: 'exact', head: true }).eq('author', userProfile?.full_name || '').gte('created_at', getDateNDaysAgo(14)).lt('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('blog_likes').select('*', { count: 'exact', head: true }).in('blog_id', userBlogIds).gte('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('blog_likes').select('*', { count: 'exact', head: true }).in('blog_id', userBlogIds).gte('created_at', getDateNDaysAgo(14)).lt('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('comments').select('*', { count: 'exact', head: true }).in('blog_id', userBlogIds).gte('created_at', getDateNDaysAgo(7))),
        connection.executeWithRetry(async (client) => client.from('comments').select('*', { count: 'exact', head: true }).in('blog_id', userBlogIds).gte('created_at', getDateNDaysAgo(14)).lt('created_at', getDateNDaysAgo(7))),
      ]);

      // Calculate changes
      const calcChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };
      const usersChange = calcChange(usersCurrent ?? 0, usersPrevious ?? 0);
      const blogsChange = calcChange(blogsCurrent ?? 0, blogsPrevious ?? 0);
      const coursesChange = calcChange(coursesCurrent ?? 0, coursesPrevious ?? 0);
      const likesChange = calcChange(likesCurrent ?? 0, likesPrevious ?? 0);
      const commentsChange = calcChange(commentsCurrent ?? 0, commentsPrevious ?? 0);
      const viewsChange = calcChange(totalViews, 0);

      // Fetch recent activity (comments and likes on admin's blogs from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Comments on admin's blogs
      const { data: recentComments } = await connection.executeWithRetry(async (client) => {
        return await client
        .from('comments')
        .select(`
          *,
          user_profiles (full_name),
          blogs (title)
        `)
          .in('blog_id', userBlogIds)
          .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      });

      // Likes on admin's blogs
      const { data: recentLikes } = await connection.executeWithRetry(async (client) => {
        return await client
        .from('blog_likes')
        .select(`
          *,
          user_profiles (full_name),
          blogs (title)
        `)
          .in('blog_id', userBlogIds)
          .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      });

      // Combine and sort recent activity
      const recentActivity = [
        ...(recentComments || []).map(comment => ({ ...comment, type: 'comment' })),
        ...(recentLikes || []).map(like => ({ ...like, type: 'like' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 10);

      // Generate user growth data for the last 30 days
      const userGrowthData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const { count } = await connection.executeWithRetry(async (client) => {
          return await client
        .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', date.toISOString())
            .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString());
        });
        
        userGrowthData.push({
          date: dateStr,
          users: count || 0
        });
      }

      setAnalytics({
        totalUsers: totalUsers ?? 0,
        totalBlogs: totalBlogs ?? 0,
        totalCourses: totalCourses ?? 0,
        totalLikes: totalLikes ?? 0,
        totalComments: totalComments ?? 0,
        totalViews: totalViews ?? 0,
        recentActivity,
        popularBlogs: blogsWithViews,
        userGrowth: userGrowthData,
        usersChange,
        blogsChange,
        coursesChange,
        likesChange,
        commentsChange,
        viewsChange
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const health = await connection.getHealthStatus?.();
      if (!health || health.connectionState !== 'connected') {
        await connection.reconnect?.();
      }
      await fetchAnalytics();
    } catch (err) {
      setLoading(false);
    }
  };

  const processUserGrowthData = (userData: any[]) => {
    return userData.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: day.users
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;  
    } else {
      return date.toLocaleDateString();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: analytics.usersChange,
      description: 'Registered users'
    },
    {
      title: 'My Blog Posts',
      value: analytics.totalBlogs,
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: analytics.blogsChange,
      description: 'Published articles'
    },
    {
      title: 'My Courses',
      value: analytics.totalCourses,
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: analytics.coursesChange,
      description: 'Created courses'
    },
    {
      title: 'Likes on My Blogs',
      value: analytics.totalLikes,
      icon: Heart,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      change: analytics.likesChange,
      description: 'Total likes received'
    },
    {
      title: 'Comments on My Blogs',
      value: analytics.totalComments,
      icon: MessageCircle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: analytics.commentsChange,
      description: 'User engagement'
    },
    {
      title: 'Views on My Blogs',
      value: analytics.totalViews,
      icon: Eye,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      change: analytics.viewsChange,
      description: 'Total page views'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back! Here's your platform overview.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics Dashboard
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className={`${card.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {card.change >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        card.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value.toLocaleString()}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                    {card.title}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs">
                    {card.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Recent Activity & Popular Posts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-500" />
                    Recent Activity
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last 7 days
                  </span>
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {analytics.recentActivity.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No recent activity
                    </p>
                  ) : (
                    analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'comment' 
                            ? 'bg-blue-100 dark:bg-blue-900/20' 
                            : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {activity.type === 'comment' ? (
                            <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">
                              {activity.user_profiles?.full_name || 'Anonymous'}
                            </span>
                            {activity.type === 'comment' ? ' commented on ' : ' liked '}
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {activity.blogs?.title}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Popular Posts */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Popular Posts
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    By views
                  </span>
                </div>
                
                <div className="space-y-4">
                  {analytics.popularBlogs.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No blog posts yet
                    </p>
                  ) : (
                    analytics.popularBlogs.map((blog, index) => (
                      <div key={blog.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {blog.title}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {blog.views || 0} views
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(blog.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* User Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  User Growth
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last 30 days
                </span>
              </div>
              
              <div className="flex items-end justify-between h-48 space-x-1">  
                {processUserGrowthData(analytics.userGrowth).map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((day.users / Math.max(...analytics.userGrowth.map(d => d.users), 1)) * 100, 2)}%` }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.02 }}
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t min-h-[2px] hover:from-orange-500 hover:to-red-500 transition-colors duration-200 cursor-pointer relative group"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {day.users} users
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-4 px-4">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;