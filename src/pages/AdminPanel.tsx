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
  Calendar,
  Activity,
  Shield,
  Settings,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Target,
  Award,
  Plus,
  Trash2,
  Edit3,
  X
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
      const viewsChange = calcChange(totalViews, 0); // Calculate views change

      // Fetch recent activity (comments and likes on admin's blogs from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Comments on admin's blogs (not comments made by admin)
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

      // Likes on admin's blogs (not likes made by admin)
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

  // Enhanced refresh logic: reconnect if needed, then fetch analytics
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Check connection health
      const health = await connection.getHealthStatus?.();
      if (!health || health.connectionState !== 'connected') {
        await connection.reconnect?.();
      }
      await fetchAnalytics();
    } catch (err) {
      // Optionally handle error
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="p-6 ">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Monitor and manage your ROBOSTAAN platform performance
                </p>
              </div>
            </div>
            
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">

                
                {/* Controls */}
                <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg"
              >
                    <Zap className="w-4 h-4" />
                <span>Refresh</span>
              </motion.button>
                </div>
              </div>
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
              Dashboard
            </button>


          </div>
        </motion.div>

        {/* Loading State */}
        {loading && activeTab === 'dashboard' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Enhanced Stats Cards */}
            {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {stat.title}
                      </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {stat.value.toLocaleString()}
                      </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.description}
                        </p>
                    </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-semibold ${
                      stat.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                    </span>
                      </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    vs last period
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Enhanced Content Sections */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Enhanced Recent Activity */}
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Recent Activity
                  </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Latest interactions on your blogs
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Last 7 days</span>
                </div>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                {analytics.recentActivity.length > 0 ? (
                  analytics.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                    >
                      <div className={`p-3 rounded-xl ${
                        activity.type === 'comment' 
                          ? 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30' 
                          : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30'
                      }`}>
                        {activity.type === 'comment' ? (
                          <MessageCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          <span className="text-orange-600 dark:text-orange-400">
                            {activity.user_profiles?.full_name || 'Anonymous'}
                          </span>
                          {activity.type === 'comment' ? ' commented on ' : ' liked '}
                          <span className="font-semibold">
                            {activity.blogs?.title || 'your blog'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(activity.created_at)}
                        </p>
                        {activity.type === 'comment' && activity.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                            "{activity.content.substring(0, 80)}..."
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        No recent activity
                      </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Activity will appear here when users interact with your blogs
                    </p>
                    </div>
                  )}
                </div>
              </motion.div>

            {/* Enhanced Popular Blogs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Popular Blogs
                </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your most engaging content
                    </p>
                  </div>
                </div>
                <Award className="w-5 h-5 text-orange-500" />
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {analytics.popularBlogs.length > 0 ? (
                  analytics.popularBlogs.map((blog, index) => (
                    <motion.div
                      key={blog.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                          {blog.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>by {blog.author}</span>
                          <span>•</span>
                          <span>{formatDate(blog.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 ml-4">
                        <div className="flex items-center space-x-1 text-sm">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {blog.blog_likes?.[0]?.count || 0}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {blog.views || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No blogs published yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Start creating content to see analytics here
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Enhanced User Growth Chart */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    User Growth
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    New user registrations over time
                  </p>
                </div>
              </div>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-1 px-4">
                {analytics.userGrowth.map((day, index) => (
                <motion.div
                    key={day.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((day.users / Math.max(...analytics.userGrowth.map(d => d.users))) * 100, 2)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05 }}
                  className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg opacity-80 hover:opacity-100 transition-all duration-200 cursor-pointer group relative"
                    title={`${day.date}: ${day.users} new users`}
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
        )}
          </>
        )}

        {/* Events Management Content */}
        {activeTab === 'events' && (
          <>
            {/* Event Messages */}
            {eventMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className={`p-4 rounded-xl border ${
                  eventMessage.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                }`}>
                  {eventMessage.text}
                </div>
              </motion.div>
            )}

            {/* Events Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Event Management
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Create and manage events with their Cloudinary image folders
                </p>
              </div>
              <button
                onClick={() => openEventModal()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </motion.div>

            {/* Events Loading */}
            {eventsLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
                </div>
              </div>
            )}

            {/* Events Grid */}
            {!eventsLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {events.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No events created yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Create your first event to get started
                    </p>
                  </div>
                ) : (
                  events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      {event.image_url && (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          {event.is_featured && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Folder className="w-4 h-4 mr-2" />
                            <span className="font-mono">{event.cloudinary_folder}</span>
                          </div>
                          
                          {event.date && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.event_type && (
                            <div className="flex items-center text-sm">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full capitalize">
                                {event.event_type}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {event.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                +{event.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(event.created_at)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openImageUploader(event)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Upload images"
                            >
                              <Image className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEventModal(event)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                              title="Edit event"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* Event Modal */}
            {showEventModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingEvent ? 'Edit Event' : 'Create New Event'}
                      </h3>
                      <button
                        onClick={resetEventForm}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleEventSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          value={eventForm.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setEventForm(prev => ({ 
                              ...prev, 
                              title: newTitle,
                              // Auto-generate folder name if it's empty or was auto-generated
                              cloudinary_folder: !prev.cloudinary_folder || 
                                               prev.cloudinary_folder === eventService.generateFolderName(prev.title)
                                               ? eventService.generateFolderName(newTitle)
                                               : prev.cloudinary_folder
                            }));
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter event title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={eventForm.description}
                          onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Event description (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cloudinary Folder Name *
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={eventForm.cloudinary_folder}
                            onChange={(e) => setEventForm(prev => ({ ...prev, cloudinary_folder: e.target.value }))}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                            placeholder="cloudinary-folder-name"
                            required
                            pattern="^[a-z0-9-]+$"
                            title="Only lowercase letters, numbers, and hyphens allowed"
                          />
                          <button
                            type="button"
                            onClick={generateFolderName}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Generate from title"
                          >
                            Auto
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          This will be the folder name in Cloudinary where event images are stored
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Event Date
                          </label>
                          <input
                            type="date"
                            value={eventForm.date}
                            onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            value={eventForm.location}
                            onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Event location"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Event Type *
                        </label>
                        <select
                          value={eventForm.event_type}
                          onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Select event type</option>
                          <option value="meetup">Meetup</option>
                          <option value="workshop">Workshop</option>
                          <option value="webinar">Webinar</option>
                          <option value="event">Event</option>
                          <option value="competition">Competition</option>
                          <option value="hackathon">Hackathon</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cover Image
                        </label>
                        
                        {/* Image Preview */}
                        {eventForm.image_url && (
                          <div className="mb-4">
                            <img 
                              src={eventForm.image_url} 
                              alt="Cover preview" 
                              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                              onError={(e) => {
                                console.log('Image preview error');
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Upload Button */}
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-3">
                            <label className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleCoverImageUpload(file);
                                  }
                                }}
                              />
                              <div className={`w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-orange-500 transition-colors ${uploadingCoverImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingCoverImage ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center space-x-2">
                                    <Upload className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload image</span>
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                          
                          <div className="text-center text-xs text-gray-500">or</div>
                          
                          {/* Manual URL Input */}
                          <input
                            type="url"
                            value={eventForm.image_url}
                            onChange={(e) => setEventForm(prev => ({ ...prev, image_url: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={eventForm.tags}
                          onChange={(e) => setEventForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="robotics, workshop, competition (comma-separated)"
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={eventForm.is_featured}
                            onChange={(e) => setEventForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Featured Event
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={resetEventForm}
                          className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                          {editingEvent ? 'Update Event' : 'Create Event'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Image Uploader Modal */}
            {showImageUploader && selectedEventForImages && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Manage Images - {selectedEventForImages.title}
                    </h2>
                    <button
                      onClick={closeImageUploader}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <EventImageUploader
                      event={selectedEventForImages}
                      onUploadComplete={handleImageUploadComplete}
                      onCoverImageUpdate={handleCoverImageUpdate}
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}


      </div>
    </div>
  );
};

export default AdminPanel;