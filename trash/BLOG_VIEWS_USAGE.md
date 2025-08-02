# Blog Views Feature - Usage Guide

## Overview

The blog views feature has been fully implemented with the following capabilities:

- **Public View Tracking**: Anyone can view blog view counts
- **Admin Analytics**: Admins can see detailed analytics for their owned blogs
- **Automatic Recording**: Views are automatically recorded when users visit blogs
- **Real-time Updates**: View counts update in real-time
- **Privacy Controls**: RLS policies ensure data security

## Database Schema

### `blog_views` Table
```sql
CREATE TABLE blog_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  viewer_ip inet,
  viewer_user_agent text,
  user_id uuid REFERENCES auth.users(id),
  session_id text
);
```

### RLS Policies
- **Public Insert**: Anyone can record views
- **Public Select**: Anyone can see view counts
- **Admin Analytics**: Admins can only see analytics for their owned blogs

## Service Layer Methods

### `supabaseService.ts`

```typescript
// Record a new view
await supabaseService.recordBlogView(blogId, {
  userId: 'optional-user-id',
  sessionId: 'optional-session-id',
  viewerIp: 'optional-ip',
  viewerUserAgent: navigator.userAgent
});

// Get view count for a blog
const { count } = await supabaseService.getBlogViewCount(blogId);

// Get detailed views for analytics
const { data: views } = await supabaseService.getBlogViews(blogId);

// Get admin analytics (owned blogs only)
const { data: reach } = await supabaseService.getAllBlogViews();

// Get public view counts for all blogs
const { data: publicViews } = await supabaseService.getPublicBlogViewCounts();
```

## React Hooks

### `useBlogViews(blogId)` - Per Blog Views
```typescript
import { useBlogViews } from '../lib/useSupabase';

const { viewCount, views, isLoading, error, fetchViews } = useBlogViews(blogId);
```

### `useBlogReach()` - Admin Analytics
```typescript
import { useBlogReach } from '../lib/useSupabase';

const { reach, isLoading, error, fetchReach } = useBlogReach();
```

### `usePublicBlogViews()` - Public View Counts
```typescript
import { usePublicBlogViews } from '../lib/useSupabase';

const { publicViews, isLoading, error, fetchPublicViews } = usePublicBlogViews();
```

## Component Usage Examples

### 1. Display View Count in Blog Card
```typescript
import { usePublicBlogViews } from '../lib/useSupabase';

const BlogCard = ({ blog }) => {
  const { publicViews } = usePublicBlogViews();
  
  const getViewCount = (blogId) => {
    const blogViews = publicViews.find(view => view.blog_id === blogId);
    return blogViews?.views || 0;
  };

  return (
    <div>
      <h3>{blog.title}</h3>
      <div className="flex items-center space-x-1">
        <Eye className="w-4 h-4" />
        <span>{getViewCount(blog.id)} views</span>
      </div>
    </div>
  );
};
```

### 2. Auto-record Views in Blog Detail
```typescript
import { useBlogViews } from '../lib/useSupabase';
import { getSupabaseConnection } from '../lib/supabaseConnection';

const BlogDetail = ({ blogId }) => {
  const { viewCount, isLoading } = useBlogViews(blogId);
  const connection = getSupabaseConnection();

  useEffect(() => {
    // Record view when blog is loaded
    const recordView = async () => {
      await connection.executeWithRetry(async (client) => {
        return await client
          .from('blog_views')
          .insert({
            blog_id: blogId,
            viewer_user_agent: navigator.userAgent
          });
      });
    };
    
    recordView();
  }, [blogId]);

  return (
    <div>
      <h1>{blog.title}</h1>
      <div className="flex items-center space-x-1">
        <Eye className="w-4 h-4" />
        <span>{viewCount} views</span>
      </div>
    </div>
  );
};
```

### 3. Admin Analytics Dashboard
```typescript
import { useBlogReach } from '../lib/useSupabase';
import { useAuth } from '../components/Auth/AuthProvider';

const AdminAnalytics = () => {
  const { isAdmin } = useAuth();
  const { reach, isLoading, error } = useBlogReach();

  if (!isAdmin) return null;

  const totalViews = reach.reduce((sum, blog) => sum + blog.views, 0);

  return (
    <div>
      <h2>Blog Analytics</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3>Total Views</h3>
          <p>{totalViews}</p>
        </div>
        <div>
          <h3>Average Views</h3>
          <p>{reach.length > 0 ? Math.round(totalViews / reach.length) : 0}</p>
        </div>
        <div>
          <h3>Blogs Tracked</h3>
          <p>{reach.length}</p>
        </div>
      </div>
      
      <div>
        <h3>Top Performing Blogs</h3>
        {reach
          .sort((a, b) => b.views - a.views)
          .slice(0, 5)
          .map(blog => (
            <div key={blog.blog_id}>
              <span>Blog {blog.blog_id.slice(0, 8)}...</span>
              <span>{blog.views} views</span>
            </div>
          ))}
      </div>
    </div>
  );
};
```

## Migration

To apply the blog views functionality:

1. **Run the migration**:
   ```bash
   # Apply the migration to your Supabase database
   supabase db push
   ```

2. **Verify the table and policies**:
   ```sql
   -- Check if table exists
   SELECT * FROM blog_views LIMIT 1;
   
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'blog_views';
   ```

## Privacy & Security

### Data Collection
- **Public Views**: Only basic view data is collected
- **User Tracking**: Optional user_id tracking for logged-in users
- **Session Tracking**: Optional session_id for anonymous users
- **IP Addresses**: Optional for analytics (not stored by default)

### Access Control
- **Public**: Can see view counts for all blogs
- **Authors**: Can see analytics for their own blogs only
- **Admins**: Can see analytics for blogs they own
- **RLS Policies**: Enforce access control at database level

### Data Retention
- Views are stored indefinitely for analytics
- Consider implementing data retention policies for production
- Views can be aggregated and old records deleted

## Performance Considerations

### Indexes
The migration includes performance indexes:
- `idx_blog_views_blog_id` - For blog-specific queries
- `idx_blog_views_user_id` - For user-specific queries  
- `idx_blog_views_viewed_at` - For time-based analytics

### Caching
- View counts are cached in React state
- Use `refetch()` to update data when needed
- Consider implementing server-side caching for high-traffic sites

### Optimization
- Views are recorded asynchronously to avoid blocking
- Batch view recording for high-traffic scenarios
- Use aggregation queries for analytics instead of counting individual records

## Troubleshooting

### Common Issues

1. **Views not recording**:
   - Check RLS policies
   - Verify user permissions
   - Check browser console for errors

2. **Analytics not showing**:
   - Ensure user is admin/author
   - Check if user owns any blogs
   - Verify RLS policies for admin access

3. **Performance issues**:
   - Check database indexes
   - Monitor query performance
   - Consider implementing caching

### Debug Queries
```sql
-- Check if views are being recorded
SELECT COUNT(*) FROM blog_views;

-- Check views for specific blog
SELECT COUNT(*) FROM blog_views WHERE blog_id = 'your-blog-id';

-- Check admin access
SELECT * FROM blog_views 
WHERE blog_id IN (
  SELECT id FROM blogs 
  WHERE author = (SELECT full_name FROM user_profiles WHERE user_id = auth.uid())
);
```

## Best Practices

1. **Privacy First**: Only collect necessary data
2. **Performance**: Use indexes and caching
3. **Security**: Always use RLS policies
4. **User Experience**: Show loading states and error handling
5. **Analytics**: Provide meaningful insights to content creators

## Future Enhancements

Potential improvements:
- Time-based analytics (daily, weekly, monthly views)
- Geographic view tracking
- Referrer tracking
- View duration tracking
- Export analytics data
- Real-time view counters
- A/B testing integration 