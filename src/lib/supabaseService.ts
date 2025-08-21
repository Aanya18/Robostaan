import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConnection } from './supabaseConnection';

// Types for better type safety
export interface Blog {
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
  updated_at: string;
  views: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  duration: string;
  category: 'Beginner' | 'Intermediate' | 'Advanced';
  video_url?: string;
  materials: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleLecture {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  slides_url: string;
  sequence_order: number;
  duration: string;
  created_at: string;
  updated_at: string;
}

export interface LectureAttachment {
  id: string;
  lecture_id: string;
  title: string;
  description: string;
  attachment_url: string;
  cloudinary_public_id: string;
  attachment_type: 'video' | 'slides' | 'document' | 'image';
  created_at: string;
  updated_at: string;
}

export interface ModuleQuiz {
  id: string;
  lecture_id: string;
  title: string;
  description: string;
  passing_score: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleProject {
  id: string;
  module_id: string;
  title: string;
  description: string;
  instructions: string;
  resources_urls: string[];
  submission_type: 'file' | 'link' | 'text';
  created_at: string;
  updated_at: string;
}

export interface CourseCapstoneProject {
  id: string;
  course_id: string;
  title: string;
  description: string;
  instructions: string;
  requirements: string;
  resources_urls: string[];
  submission_type: 'file' | 'link' | 'text';
  created_at: string;
  updated_at: string;
}

export interface UserQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProjectSubmission {
  id: string;
  user_id: string;
  project_id?: string;
  capstone_id?: string;
  submission_content: string;
  submission_url: string;
  feedback: string;
  score: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin' | 'instructor';
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  blog_id?: string;
  course_id?: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogLike {
  id: string;
  user_id: string;
  blog_id: string;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
  completed_at?: string;
}

export interface BlogView {
  id: string;
  blog_id: string;
  viewed_at: string;
  viewer_ip?: string;
  viewer_user_agent?: string;
  user_id?: string;
  session_id?: string;
}

export interface GalleryImage {
  id: string;
  title?: string;
  description?: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  cloudinary_secure_url: string;
  tags: string[];
  width?: number;
  height?: number;
  file_size?: number;
  format?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  display_order: number;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  cloudinary_folder: string;
  date?: string;
  location?: string;
  event_type?: string;
  event_status?: 'upcoming' | 'ongoing' | 'completed';
  image_url?: string;
  tags: string[];
  is_featured: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Service class for serverless-optimized data access with connection pooling
class SupabaseService {
  private readonly connection = getSupabaseConnection();

  async getClient(): Promise<SupabaseClient> {
    return await this.connection.getClient();
  }

  // ========== BLOG OPERATIONS ==========

  async getBlogs(options: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    tags?: string[];
    search?: string;
  } = {}): Promise<{ data: Blog[]; error: any }> {
    // Use connection pool for high-traffic operations
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      let query = client.from('blogs').select('*');

      if (options.featured !== undefined) {
        query = query.eq('featured', options.featured);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      return { data: data ?? [], error };
    });
  }

  async getBlogById(id: string): Promise<{ data: Blog | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async createBlog(blog: Omit<Blog, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Blog | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('blogs')
        .insert(blog)
        .select()
        .single();
    });
  }

  async updateBlog(id: string, updates: Partial<Blog>): Promise<{ data: Blog | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('blogs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteBlog(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('blogs')
        .delete()
        .eq('id', id);
    });
  }

  // ========== COURSE OPERATIONS ==========

  async getCourses(options: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    category?: string;
    search?: string;
  } = {}): Promise<{ data: Course[]; error: any }> {
    // Use connection pool for high-traffic operations
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      let query = client.from('courses').select('*');

      if (options.featured !== undefined) {
        query = query.eq('featured', options.featured);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      return { data: data ?? [], error };
    });
  }

  async getCourseById(id: string): Promise<{ data: Course | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Course | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('courses')
        .insert(course)
        .select()
        .single();
    });
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<{ data: Course | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('courses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteCourse(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('courses')
        .delete()
        .eq('id', id);
    });
  }

  // ========== USER PROFILE OPERATIONS ==========

  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    });
  }

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: UserProfile | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('user_profiles')
        .insert(profile)
        .select()
        .single();
    });
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
    });
  }

  // ========== COMMENT OPERATIONS ==========

  async getComments(options: {
    blog_id?: string;
    course_id?: string;
    parent_id?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Comment[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      let query = client.from('comments').select('*');

      if (options.blog_id) {
        query = query.eq('blog_id', options.blog_id);
      }

      if (options.course_id) {
        query = query.eq('course_id', options.course_id);
      }

      if (options.parent_id) {
        query = query.eq('parent_id', options.parent_id);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: true });
      const { data, error } = await query;
      return { data: data ?? [], error };
    });
  }

  async createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Comment | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('comments')
        .insert(comment)
        .select()
        .single();
    });
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<{ data: Comment | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('comments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteComment(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('comments')
        .delete()
        .eq('id', id);
    });
  }

  // ========== BLOG LIKES OPERATIONS ==========

  async getBlogLikes(blogId: string): Promise<{ data: BlogLike[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('blog_likes')
        .select('*')
        .eq('blog_id', blogId);
      return { data: data ?? [], error };
    });
  }

  async toggleBlogLike(blogId: string, userId: string): Promise<{ data: BlogLike | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      // Check if like exists
      const { data: existingLike } = await client
        .from('blog_likes')
        .select('*')
        .eq('blog_id', blogId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Remove like
        await client
          .from('blog_likes')
          .delete()
          .eq('blog_id', blogId)
          .eq('user_id', userId);
        return { data: null, error: null };
      } else {
        // Add like
        return await client
          .from('blog_likes')
          .insert({ blog_id: blogId, user_id: userId })
          .select()
          .single();
      }
    });
  }

  // ========== COURSE ENROLLMENT OPERATIONS ==========

  async getCourseEnrollments(userId: string): Promise<{ data: CourseEnrollment[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId);
      return { data: data ?? [], error };
    });
  }

  async enrollInCourse(courseId: string, userId: string): Promise<{ data: CourseEnrollment | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('course_enrollments')
        .insert({ course_id: courseId, user_id: userId })
        .select()
        .single();
    });
  }

  async updateEnrollmentProgress(enrollmentId: string, progress: number): Promise<{ data: CourseEnrollment | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const updates: Partial<CourseEnrollment> = { progress };
      
      if (progress >= 100) {
        updates.completed_at = new Date().toISOString();
      }

      return await client
        .from('course_enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .select()
        .single();
    });
  }

  // ========== BLOG VIEWS OPERATIONS ==========

  /**
   * Record a view for a blog post. Anyone (public) can call this.
   */
  async recordBlogView(blogId: string, options: {
    userId?: string;
    sessionId?: string;
    viewerIp?: string;
    viewerUserAgent?: string;
  } = {}): Promise<{ data: BlogView | null; error: any }> {
    // Use connection pool for high-frequency operations like view tracking
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('blog_views')
        .insert({
          blog_id: blogId,
          user_id: options.userId,
          session_id: options.sessionId,
          viewer_ip: options.viewerIp,
          viewer_user_agent: options.viewerUserAgent
        })
        .select()
        .single();
    });
  }

  /**
   * Increment the views column in the blogs table by 1, only if not already viewed by this user or session.
   */
  async incrementBlogViews(blogId: string, userId?: string, sessionId?: string): Promise<void> {
    await this.connection.executeWithRetry(async (client) => {
      // Check if a view already exists for this user or session
      const { count } = await client
        .from('blog_views')
        .select('id', { count: 'exact', head: true })
        .eq('blog_id', blogId)
        .or(userId ? `user_id.eq.${userId}` : `session_id.eq.${sessionId}`);
      if (count && count > 0) return;
      // Insert view record
      await client.from('blog_views').insert({
        blog_id: blogId,
        user_id: userId,
        session_id: sessionId
      });
      // Increment views column
      await client.rpc('increment_blog_views', { blog_id: blogId });
    });
  }

  /**
   * Get the total view count for a blog (public, author, or admin).
   */
  async getBlogViewCount(blogId: string): Promise<{ count: number; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { count, error } = await client
        .from('blog_views')
        .select('id', { count: 'exact', head: true })
        .eq('blog_id', blogId);
      return { count: count ?? 0, error };
    });
  }

  /**
   * Get all views for a blog (admin/author analytics).
   */
  async getBlogViews(blogId: string): Promise<{ data: BlogView[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('blog_views')
        .select('*')
        .eq('blog_id', blogId)
        .order('viewed_at', { ascending: false });
      return { data: data ?? [], error };
    });
  }

  /**
   * Get total views for all blogs (admin analytics - only owned blogs).
   */
  async getAllBlogViews(): Promise<{ data: { blog_id: string; views: number }[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      // First get the current user's profile
      const { data: userProfile, error: profileError } = await client
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', (await client.auth.getUser()).data.user?.id)
        .single();
      
      if (profileError || !userProfile) {
        return { data: [], error: profileError };
      }

      // Get blogs owned by this user
      const { data: userBlogs, error: blogsError } = await client
        .from('blogs')
        .select('id')
        .eq('author', userProfile.full_name);

      if (blogsError || !userBlogs || userBlogs.length === 0) {
        return { data: [], error: blogsError };
      }

      const blogIds = userBlogs.map(blog => blog.id);

      // Get views for these blogs
      const { data: views, error: viewsError } = await client
        .from('blog_views')
        .select('blog_id')
        .in('blog_id', blogIds);

      if (viewsError) return { data: [], error: viewsError };

      // Aggregate in JS
      const counts: Record<string, number> = {};
      (views ?? []).forEach((row: { blog_id: string }) => {
        if (row.blog_id) counts[row.blog_id] = (counts[row.blog_id] || 0) + 1;
      });

      return {
        data: Object.entries(counts).map(([blog_id, views]) => ({ blog_id, views })),
        error: null
      };
    });
  }

  /**
   * Get public view counts for all blogs (public display).
   */
  async getPublicBlogViewCounts(): Promise<{ data: { blog_id: string; views: number }[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('blog_views')
        .select('blog_id');
      if (error) return { data: [], error };
      // Aggregate in JS
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row: { blog_id: string }) => {
        if (row.blog_id) counts[row.blog_id] = (counts[row.blog_id] || 0) + 1;
      });
      return {
        data: Object.entries(counts).map(([blog_id, views]) => ({ blog_id, views })),
        error: null
      };
    });
  }

  // ========== REALTIME SUBSCRIPTIONS ==========

  async subscribeToBlogUpdates(callback: (payload: any) => void): Promise<void> {
    await this.connection.subscribeToChannel('blog-updates', callback, 'blogs', {
      events: ['INSERT', 'UPDATE', 'DELETE'],
      autoReconnect: true
    });
  }

  async subscribeToCourseUpdates(callback: (payload: any) => void): Promise<void> {
    await this.connection.subscribeToChannel('course-updates', callback, 'courses', {
      events: ['INSERT', 'UPDATE', 'DELETE'],
      autoReconnect: true
    });
  }

  async subscribeToComments(callback: (payload: any) => void): Promise<void> {
    await this.connection.subscribeToChannel('comment-updates', callback, 'comments', {
      events: ['INSERT', 'UPDATE', 'DELETE'],
      autoReconnect: true
    });
  }

  async subscribeToLikes(callback: (payload: any) => void): Promise<void> {
    await this.connection.subscribeToChannel('like-updates', callback, 'blog_likes', {
      events: ['INSERT', 'DELETE'],
      autoReconnect: true
    });
  }

  async subscribeToViews(callback: (payload: any) => void): Promise<void> {
    await this.connection.subscribeToChannel('view-updates', callback, 'blog_views', {
      events: ['INSERT'],
      autoReconnect: true
    });
  }

  // ========== UTILITY METHODS ==========

  async getConnectionStatus(): Promise<'connected' | 'connecting' | 'disconnected' | 'error'> {
    return this.connection.getConnectionStatus();
  }

  async getHealthStatus(): Promise<{
    connectionState: string;
    lastHealthCheck: number;
    reconnectAttempts: number;
    activeChannels: number;
    isPageVisible: boolean;
  }> {
    return this.connection.getHealthStatus();
  }

  // ========== CONNECTION OPERATIONS ==========

  async executeWithConnection<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return this.connection.executeWithRetry(operation);
  }

  async cleanup(): Promise<void> {
    this.connection.cleanup();
  }
  // ========== GALLERY IMAGE OPERATIONS ==========

  async getGalleryImages(options: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    tags?: string[];
    search?: string;
  } = {}): Promise<{ data: GalleryImage[]; error: any }> {
    // Use connection pool for high-traffic operations
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      console.log('🔍 SupabaseService: Starting gallery images query...');
      
      let query = client.from('gallery_images').select('*');

      if (options.featured !== undefined) {
        query = query.eq('is_featured', options.featured);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('display_order', { ascending: true })
                  .order('created_at', { ascending: false });
      
      console.log('🚀 SupabaseService: Executing query...');
      const { data, error } = await query;
      
      console.log('📊 SupabaseService: Query result:', { 
        dataLength: data?.length, 
        error: error ? error.message : null,
        sampleData: data?.[0] 
      });
      
      return { data: data ?? [], error };
    });
  }

  async getGalleryImageById(id: string): Promise<{ data: GalleryImage | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('gallery_images')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async createGalleryImage(image: Omit<GalleryImage, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: GalleryImage | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('gallery_images')
        .insert(image)
        .select()
        .single();
    });
  }

  async updateGalleryImage(id: string, updates: Partial<GalleryImage>): Promise<{ data: GalleryImage | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('gallery_images')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteGalleryImage(id: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('gallery_images')
        .delete()
        .eq('id', id);
    });
  }

  async deleteGalleryImageByPublicId(publicId: string): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('gallery_images')
        .delete()
        .eq('cloudinary_public_id', publicId);
    });
  }

  async updateGalleryImageOrder(imageUpdates: { id: string; display_order: number }[]): Promise<{ error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const promises = imageUpdates.map(update =>
        client
          .from('gallery_images')
          .update({ display_order: update.display_order, updated_at: new Date().toISOString() })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      return { error: errors.length > 0 ? errors : null };
    });
  }

  // ========== EVENT OPERATIONS ==========

  async getEvents(options: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    tags?: string[];
    search?: string;
  } = {}): Promise<{ data: Event[]; error: any }> {
    console.log('🔄 SupabaseService.getEvents called with options:', options);
    
    // Use direct connection instead of connection pool for debugging
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      console.log('🔗 SupabaseService.getEvents got client connection');
      
      let query = client.from('events').select('*');

      if (options.featured !== undefined) {
        query = query.eq('is_featured', options.featured);
        console.log('🔍 Added featured filter:', options.featured);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
        console.log('🔍 Added tags filter:', options.tags);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
        console.log('🔍 Added search filter:', options.search);
      }

      if (options.limit) {
        query = query.limit(options.limit);
        console.log('🔍 Added limit:', options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        console.log('🔍 Added offset range:', options.offset);
      }

      query = query.order('created_at', { ascending: false });
      console.log('🔍 Added ordering by date and created_at');
      
      console.log('🚀 SupabaseService.getEvents executing query...');
      const { data, error } = await query;
      
      console.log('📊 SupabaseService.getEvents raw result:', { data, error });
      console.log('📊 Data length:', data?.length);
      console.log('📊 First item:', data?.[0]);
      
      return { data: data ?? [], error };
    });
  }

  async getEventById(id: string): Promise<{ data: Event | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async getEventByFolder(cloudinaryFolder: string): Promise<{ data: Event | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('events')
        .select('*')
        .eq('cloudinary_folder', cloudinaryFolder)
        .single();
    });
  }

  async createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Event | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('events')
        .insert(event)
        .select()
        .single();
    });
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<{ data: Event | null; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      return await client
        .from('events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteEvent(id: string): Promise<{ error: any }> {
    console.log('🗑️ SupabaseService.deleteEvent called with ID:', id);
    
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      console.log('🔗 SupabaseService.deleteEvent got client connection');
      
      const result = await client
        .from('events')
        .delete()
        .eq('id', id);
      
      console.log('📊 SupabaseService.deleteEvent result:', result);
      
      return result;
    });
  }

  async getFeaturedEvents(limit: number = 3): Promise<{ data: Event[]; error: any }> {
    console.log('🔄 SupabaseService.getFeaturedEvents called with limit:', limit);
    
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      console.log('🔗 SupabaseService.getFeaturedEvents got client connection');
      
      const { data, error } = await client
        .from('events')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      console.log('📊 SupabaseService.getFeaturedEvents result:', { data, error });
      console.log('📊 Featured events count:', data?.length);
      
      return { data: data ?? [], error };
    });
  }

  async getEventFolders(): Promise<{ data: string[]; error: any }> {
    return this.connection.executeWithRetry(async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('events')
        .select('cloudinary_folder')
        .order('created_at', { ascending: false });
      
      if (error) return { data: [], error };
      
      return { 
        data: data?.map(event => event.cloudinary_folder) ?? [], 
        error: null 
      };
    });
  }
}

// Create singleton instance
const supabaseService = new SupabaseService();

// Export the service instance
export default supabaseService;

// ===== Backward-compatibility named exports =====
// Provide function wrappers so existing code that imported named functions continues to work
export const getCourseById = supabaseService.getCourseById.bind(supabaseService);
