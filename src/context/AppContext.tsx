import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseConnection } from '../lib/supabaseConnection';
import type { Blog, Course } from '../lib/supabaseService';
import { useAuth } from '../components/Auth/AuthProvider';

export type { Blog, Course };

interface AppContextType {
  blogs: Blog[];
  courses: Course[];
  projects: any[];
  userBlogs: Blog[];
  userCourses: Course[];
  darkMode: boolean;
  loading: boolean;
  isAdmin: boolean;
  addBlog: (blog: Omit<Blog, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBlog: (id: string, blog: Partial<Blog>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  addCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addProject: (project: any) => Promise<void>;
  updateProject: (id: string, project: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  toggleDarkMode: () => void;
  refreshData: () => Promise<void>;
  refreshUserContent: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataCache, setDataCache] = useState<{
    blogs?: Blog[];
    courses?: Course[];
    projects?: any[];
    lastFetch?: number;
  }>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [projects, setProjects] = useState<any[]>([]);
  
  const { isAdmin: authIsAdmin, user, profile } = useAuth();
  const connection = getSupabaseConnection();

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    // Initial data fetch with timeout
    fetchDataWithTimeout();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Wait for profile to be loaded before fetching user content
    if (user && profile) {
      fetchUserContent();
    } else {
      setUserBlogs([]);
      setUserCourses([]);
    }
  }, [user, profile]);

  useEffect(() => {
    // Keep-alive ping to prevent Supabase cold starts using the connection manager
    const interval = setInterval(async () => {
      try {
        await connection.executeWithRetry(async (client) => {
          await client.from('courses').select('id').limit(1);
        });
      } catch (e) {
        // Ignore errors, this is just to keep the backend warm
      }
    }, 30 * 1000); // every 30 seconds
    return () => clearInterval(interval);
  }, [connection]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      connection.executeWithRetry(async (client) => {
        const { data: { session } } = await client.auth.getSession();
        if (!session) {
          // Session expired or invalid. Optionally: show login modal or redirect to login page.
          // Example: window.location.href = '/login';
        } else {
          // Optionally re-fetch user profile and user content
          refreshUserContent();
        }
        return session;
      });
    }
  }, [connectionStatus, connection]);

  // Automatically refetch data when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchDataWithTimeout(true); // force refresh on reconnection
    }
  }, [connectionStatus]);

  const ensureConnection = async () => {
    if (connectionStatus !== 'connected') {
      setConnectionStatus('connecting');
      try {
        await connection.reconnect();
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('disconnected');
        throw new Error('Failed to reconnect to Supabase');
      }
    }
  };

  const fetchDataWithTimeout = async (forceRefresh = false) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Data fetch timeout')), 30000)
    );
    try {
      await Promise.race([fetchData(forceRefresh), timeoutPromise]);
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Data fetch error or timeout:', error);
      setBlogs([]);
      setCourses([]);
      setLoading(false);
      // Keep the app loaded and show empty state; avoid reload loops
      // Tip: Check console for the exact Supabase error (RLS/policies, table missing, etc.)
    }
  };

  const fetchData = async (forceRefresh = false) => {
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    // Use cache if available and not expired, unless force refresh
    if (!forceRefresh && dataCache.lastFetch && (now - dataCache.lastFetch) < cacheExpiry) {
      if (dataCache.blogs) setBlogs(dataCache.blogs);
      if (dataCache.courses) setCourses(dataCache.courses);
      if (dataCache.projects) setProjects(dataCache.projects);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch blogs
      let blogsData = [];
      try {
        const blogsResult = await connection.executeWithRetry(async (client) => {
          return await client.from('blogs').select('*').order('created_at', { ascending: false });
        });
        blogsData = blogsResult?.data || [];
        const blogsError = blogsResult?.error;
        if (blogsError && !blogsError.message.includes('relation "blogs" does not exist')) {
          console.error('Error fetching blogs:', blogsError);
        } else {
          setBlogs(blogsData);
        }
      } catch (error) {
        console.error('Blogs fetch timeout or error:', error);
      }

      // Fetch courses
      let coursesData = [];
      try {
        const coursesResult = await connection.executeWithRetry(async (client) => {
          return await client.from('courses').select('*').order('created_at', { ascending: false });
        });
        coursesData = coursesResult?.data || [];
        const coursesError = coursesResult?.error;
        if (coursesError && !coursesError.message.includes('relation "courses" does not exist')) {
          console.error('Error fetching courses:', coursesError);
        } else {
          setCourses(coursesData);
        }
      } catch (error) {
        console.error('Courses fetch timeout or error:', error);
      }

      // Fetch projects
      let projectsData = [];
      try {
        const projectsResult = await connection.executeWithRetry(async (client) => {
          return await client.from('projects').select('*').order('created_at', { ascending: false });
        });
        projectsData = projectsResult?.data || [];
        const projectsError = projectsResult?.error;
        if (projectsError && !projectsError.message.includes('relation "projects" does not exist')) {
          console.error('Error fetching projects:', projectsError);
        } else {
          const normalizedProjects = (projectsData || []).map((p: any) => ({
            ...p,
            sourceFiles: p.source_files || [],
            demoUrl: p.demo_url,
            featured: !!p.featured
          }));
          setProjects(normalizedProjects);
        }
      } catch (error) {
        console.error('Projects fetch timeout or error:', error);
      }

      // Update cache only if we got some data
      setDataCache({
        blogs: blogsData,
        courses: coursesData,
        projects: projectsData,
        lastFetch: now
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      // Don't clear data on error, keep existing
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (forceRefresh = false) => {
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    if (!forceRefresh && dataCache.lastFetch && (now - dataCache.lastFetch) < cacheExpiry && dataCache.projects) {
      setProjects(dataCache.projects);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const projectsResult = await connection.executeWithRetry(async (client) => {
        return await client.from('projects').select('*').order('created_at', { ascending: false });
      });
      const projectsData = projectsResult?.data;
      const projectsError = projectsResult?.error;
      if (projectsError && !projectsError.message.includes('relation "projects" does not exist')) {
        console.error('Error fetching projects:', projectsError);
      } else {
        const normalizedProjects = (projectsData || []).map((p: any) => ({
          ...p,
          sourceFiles: p.source_files || [],
          demoUrl: p.demo_url,
          featured: !!p.featured
        }));
        setProjects(normalizedProjects);
      }
      setDataCache(prev => ({
        ...prev,
        projects: projectsData || [],
        lastFetch: now
      }));
    } catch (error) {
      console.error('Projects fetch timeout or error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    await fetchProjects(true);
  };

  const fetchUserContent = async () => {
    if (!user || !profile) return;
    try {
      // Fetch user's blogs based on user_id using the connection manager
      try {
        const userBlogsResult = await connection.executeWithRetry(async (client) => {
          return await client
            .from('blogs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        });
        
        const userBlogsData = userBlogsResult?.data;
        const userBlogsError = userBlogsResult?.error;
        if (userBlogsError) {
          console.error('Error fetching user blogs:', userBlogsError);
        } else {
          setUserBlogs(userBlogsData || []);
        }
      } catch (error) {
        console.error('User blogs fetch timeout:', error);
        // Keep existing data on timeout
      }
      
      // For courses, admins can see all courses as "their" courses
      if (profile.role === 'admin') {
        try {
          const adminCoursesResult = await connection.executeWithRetry(async (client) => {
            return await client
              .from('courses')
              .select('*')
              .order('created_at', { ascending: false });
          });
          
          const adminCoursesData = adminCoursesResult?.data;
          const adminCoursesError = adminCoursesResult?.error;
          if (adminCoursesError) {
            console.error('Error fetching admin courses:', adminCoursesError);
          } else {
            setUserCourses(adminCoursesData || []);
          }
        } catch (error) {
          console.error('Admin courses fetch timeout:', error);
          // Keep existing data on timeout
        }
      } else {
        // Regular users see their enrolled courses
        try {
          const userCoursesResult = await connection.executeWithRetry(async (client) => {
            return await client
              .from('course_enrollments')
              .select(`
                *,
                courses (*)
              `)
              .eq('user_id', user.id)
              .order('enrolled_at', { ascending: false });
          });
          
          const userCoursesData = userCoursesResult?.data;
          const userCoursesError = userCoursesResult?.error;
          if (userCoursesError) {
            console.error('Error fetching user course enrollments:', userCoursesError);
          } else {
            // Extract course data from enrollments
            const courses = userCoursesData?.map((enrollment: any) => enrollment.courses).filter(Boolean) || [];
            setUserCourses(courses);
          }
        } catch (error) {
          console.error('User course enrollments fetch timeout:', error);
          // Keep existing data on timeout
        }
      }
    } catch (error) {
      console.error('Error fetching user content:', error);
    }
  };

  const refreshData = async () => {
    await fetchDataWithTimeout(true);
  };

  const refreshUserContent = async () => {
    await fetchUserContent();
  };

  const addBlog = async (blog: Omit<Blog, 'id' | 'created_at' | 'updated_at'>) => {
    await ensureConnection();
    try {
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('blogs')
          .insert([{ ...blog, user_id: user?.id }])
          .select()
          .single();
      });

      if (error) throw error;
      setBlogs(prev => [data, ...prev]);
      
      // Update user blogs if this user created it
      if (user) {
        setUserBlogs(prev => [data, ...prev]);
      }
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        blogs: [data, ...(prev.blogs || [])],
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error adding blog:', error);
      throw error;
    }
  };

  const updateBlog = async (id: string, updatedBlog: Partial<Blog>) => {
    await ensureConnection();
    try {
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('blogs')
          .update({ ...updatedBlog, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
      });

      if (error) throw error;
      setBlogs(prev => prev.map(blog => blog.id === id ? data : blog));
      setUserBlogs(prev => prev.map(blog => blog.id === id ? data : blog));
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        blogs: prev.blogs?.map(blog => blog.id === id ? data : blog),
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error updating blog:', error);
      throw error;
    }
  };

  const deleteBlog = async (id: string) => {
    await ensureConnection();
    try {
      const { error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('blogs')
          .delete()
          .eq('id', id);
      });

      if (error) throw error;
      setBlogs(prev => prev.filter(blog => blog.id !== id));
      setUserBlogs(prev => prev.filter(blog => blog.id !== id));
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        blogs: prev.blogs?.filter(blog => blog.id !== id),
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error deleting blog:', error);
      throw error;
    }
  };

  const addCourse = async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    await ensureConnection();
    try {
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('courses')
          .insert([course])
          .select()
          .single();
      });

      if (error) throw error;
      setCourses(prev => [data, ...prev]);
      
      // Update user courses for admins
      if (profile?.role === 'admin') {
        setUserCourses(prev => [data, ...prev]);
      }
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        courses: [data, ...(prev.courses || [])],
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error adding course:', error);
      throw error;
    }
  };

  const updateCourse = async (id: string, updatedCourse: Partial<Course>) => {
    await ensureConnection();
    try {
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('courses')
          .update({ ...updatedCourse, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
      });

      if (error) throw error;
      setCourses(prev => prev.map(course => course.id === id ? data : course));
      setUserCourses(prev => prev.map(course => course.id === id ? data : course));
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        courses: prev.courses?.map(course => course.id === id ? data : course),
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error updating course:', error);
      throw error;
    }
  };

  const deleteCourse = async (id: string) => {
    await ensureConnection();
    try {
      const { error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('courses')
          .delete()
          .eq('id', id);
      });

      if (error) throw error;
      setCourses(prev => prev.filter(course => course.id !== id));
      setUserCourses(prev => prev.filter(course => course.id !== id));
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        courses: prev.courses?.filter(course => course.id !== id),
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error deleting course:', error);
      throw error;
    }
  };

  const addProject = async (project: any) => {
    await ensureConnection();
    try {
      // Map camelCase to snake_case for Supabase
      const supabaseProject = {
        ...project,
        demo_url: project.demoUrl,
        source_files: project.sourceFiles,
      };
      delete supabaseProject.demoUrl;
      delete supabaseProject.sourceFiles;
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('projects')
          .insert([supabaseProject])
          .select()
          .single();
      });
      if (error) throw error;
      setProjects(prev => [{ ...data, sourceFiles: data.source_files || [], demoUrl: data.demo_url, featured: !!data.featured }, ...prev]);
      setDataCache(prev => ({
        ...prev,
        projects: [{ ...data, sourceFiles: data.source_files || [], demoUrl: data.demo_url, featured: !!data.featured }, ...(prev.projects || [])],
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updatedProject: any) => {
    await ensureConnection();
    try {
      // Map camelCase to snake_case for Supabase
      const supabaseProject = {
        ...updatedProject,
        demo_url: updatedProject.demoUrl,
        source_files: updatedProject.sourceFiles,
        updated_at: new Date().toISOString(),
      };
      delete supabaseProject.demoUrl;
      delete supabaseProject.sourceFiles;
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('projects')
          .update(supabaseProject)
          .eq('id', id)
          .select()
          .single();
      });
      if (error) throw error;
      setProjects(prev => prev.map(project => project.id === id ? { ...data, sourceFiles: data.source_files || [], demoUrl: data.demo_url, featured: !!data.featured } : project));
      setDataCache(prev => ({
        ...prev,
        projects: prev.projects?.map(project => project.id === id ? { ...data, sourceFiles: data.source_files || [], demoUrl: data.demo_url, featured: !!data.featured } : project),
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    await ensureConnection();
    try {
      const { error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('projects')
          .delete()
          .eq('id', id);
      });
      if (error) throw error;
      setProjects(prev => prev.filter(project => project.id !== id));
      setDataCache(prev => ({
        ...prev,
        projects: prev.projects?.filter(project => project.id !== id),
        lastFetch: Date.now()
      }));
    } catch (error) {
      if (String(error).includes('connection') || String(error).includes('timeout')) {
        setConnectionStatus('disconnected');
      }
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const value: AppContextType = {
    blogs,
    courses,
    projects,
    userBlogs,
    userCourses,
    darkMode,
    loading,
    isAdmin: authIsAdmin,
    addBlog,
    updateBlog,
    deleteBlog,
    addCourse,
    updateCourse,
    deleteCourse,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects,
    setProjects,
    toggleDarkMode,
    refreshData,
    refreshUserContent
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};