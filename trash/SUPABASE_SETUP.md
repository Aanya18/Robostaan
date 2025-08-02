# Supabase Setup Instructions

## Current Issue
The Supabase connection is not working properly. Here are the steps to resolve this:

## Step 1: Verify Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if the project `juoyqkqmzshnidszqlaz` exists and is active
3. If not, create a new project

## Step 2: Get Correct Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (should look like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 3: Update Environment Variables
Replace the values in `.env` file with your actual credentials:

```env
VITE_SUPABASE_URL=your_actual_project_url
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

## Step 4: Run Database Migrations
The project includes migration files that need to be applied to your Supabase database:

### Option A: Using Supabase CLI (Recommended)
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Push migrations:
   ```bash
   supabase db push
   ```

### Option B: Manual SQL Execution
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content from these files in order:
   - `supabase/migrations/20250705155609_shrill_torch.sql`
   - `supabase/migrations/20250705160627_dawn_tooth.sql`
4. Execute each migration

## Step 5: Configure Authentication
1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/**`
   - **Email confirmation**: Disable for testing (can enable later)

## Step 6: Create Demo Users
After running migrations, create these demo accounts in Supabase Auth:

1. Go to **Authentication** → **Users**
2. Create the following users:

### Admin Account
- **Email**: `admin@robostaan.in`
- **Password**: `admin123`
- **Role**: `admin`

### Instructor Account
- **Email**: `instructor@robostaan.in`
- **Password**: `instructor123`
- **Role**: `instructor`

### Student Account
- **Email**: `student@robostaan.in`
- **Password**: `student123`
- **Role**: `user`

## Step 7: Test the Connection
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:5173`
3. Try logging in with one of the demo accounts
4. Check the browser console for any connection errors

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Verify your Supabase URL and anon key are correct
   - Make sure you're using the anon key, not the service role key

2. **"Project not found" error**
   - Check if your Supabase project is active
   - Verify the project ID in the URL

3. **"RLS policy violation" error**
   - Make sure you've run the migration files
   - Check that the user_profiles table exists

4. **"Connection timeout" error**
   - Check your internet connection
   - Verify the Supabase project is not paused

### Debug Steps

1. Check browser console for detailed error messages
2. Verify environment variables are loaded correctly
3. Test Supabase connection in the dashboard
4. Check if the project is in the correct region

## Production Deployment

For production deployment:

1. Update environment variables with production Supabase credentials
2. Configure proper redirect URLs for your domain
3. Enable email confirmation if needed
4. Set up proper RLS policies for production
5. Configure CORS settings for your domain

## Security Notes

- Never commit your Supabase service role key to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your API keys
- Monitor your Supabase usage and costs