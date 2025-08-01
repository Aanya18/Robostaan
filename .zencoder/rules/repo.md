# ROBOSTAAN - Repository Information

## Project Overview
ROBOSTAAN is a React + TypeScript + Vite application for a robotics community website featuring event management, gallery functionality, and user interaction capabilities.

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: Framer Motion for animations, Lucide React for icons
- **Backend**: Supabase (Database + Authentication)  
- **Image Management**: Cloudinary
- **Deployment**: Vite build system

### Key Features
1. **Event Management System** (Admin-only)
2. **Event-based Gallery System** 
3. **User Authentication** (Supabase Auth)
4. **Responsive Design** (Mobile-first)
5. **SEO Optimization** (React Helmet Async)

## Event-Gallery Flow Implementation

### Database Schema (Supabase)
```sql
-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  location TEXT,
  image_url TEXT,
  cloudinary_folder TEXT NOT NULL, -- Key field for gallery integration
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Flow Architecture
```
Admin Panel → Creates Event → Stores in Supabase (with cloudinary_folder)
                  ↓
          Cloudinary Folder (images uploaded separately)
                  ↓
Events Page ← Fetches events ← Shows event details + gallery images
                  ↓
Gallery Page ← Shows folder list ← Click folder → Show images
```

### Key Services

#### 1. EventService (`src/services/eventService.ts`)
- `createEvent()` - Admin creates events with Cloudinary folder names
- `getEvents()` - Fetch events with filtering/pagination
- `getFeaturedEvents()` - Get featured events for homepage
- `getEventImages()` - Fetch images from Cloudinary folder
- `updateEvent()` / `deleteEvent()` - Admin management

#### 2. CloudinaryService (`src/services/cloudinaryService.ts`)  
- `searchImages()` - Search images by folder (with fallback to mock data)
- `getFolderImages()` - Get images from specific event folder
- `generateTransformationUrl()` - Create optimized image URLs
- `uploadImage()` - Upload new images (Admin only)

#### 3. SupabaseService (`src/lib/supabaseService.ts`)
- Database operations for events, users, gallery images
- Authentication helpers
- Type definitions

### Important Pages

#### AdminPanel (`src/pages/AdminPanel.tsx`)
- **Features**: Event CRUD, Image upload, User management
- **Access**: Login required (Admin only)
- **Key Functions**: 
  - Create events with `cloudinary_folder` field
  - Upload/delete events
  - Image management per event

#### Events (`src/pages/Events.tsx`)
- **Features**: Display all events with inline galleries
- **User Flow**: 
  - Shows featured events at top
  - Lists all events with details
  - Click "View Gallery" → Expands to show event images
- **Data Sources**: 
  - Events from Supabase
  - Images from Cloudinary (via cloudinary_folder)

#### Gallery (`src/pages/Gallery.tsx`)
- **Features**: Folder-based image browser
- **User Flow**:
  - Shows list of events as "folders"
  - Click event → Shows all images from that event's Cloudinary folder
  - Back button to return to folder list
- **View Modes**: 
  - `folders` - List of events
  - `gallery` - Images from selected event

### File Structure

```
src/
├── components/           # Reusable UI components
├── context/             # React Context (App, Auth)
├── lib/                 # Core services (Supabase, utilities)
├── pages/               # Route components
├── services/            # Business logic services
├── types/               # TypeScript type definitions
└── config/              # Configuration files
```

### Environment Variables Required
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_API_KEY=
VITE_CLOUDINARY_API_SECRET=
```

### Development Notes

#### Event-Gallery Integration
- Events store `cloudinary_folder` field matching Cloudinary folder names
- Gallery pages use this field to fetch images from corresponding folders
- Images are searched using Cloudinary Admin API (fallback to mock data)
- Mock data provides realistic image URLs for development/testing

#### Admin Workflow
1. Admin logs into AdminPanel
2. Creates event with title, description, date, location
3. System generates `cloudinary_folder` name from event title
4. Admin uploads images to Cloudinary (same folder name)
5. Users see event details + gallery images automatically

#### User Experience
- Events page: Browse events, expand to see galleries inline
- Gallery page: Folder-based navigation, click event to see all photos
- Responsive design works on mobile/desktop
- Loading states and error handling throughout

### Known Limitations
1. Cloudinary Admin API requires server-side authentication
2. Current implementation uses mock data fallback for development
3. Image upload to specific folders needs backend implementation
4. No image deletion from Cloudinary folders (manual process)

### Future Enhancements
1. Backend API for Cloudinary Admin operations
2. Image upload with automatic folder assignment
3. Image metadata management
4. Advanced search and filtering
5. User favorites and collections

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Key Dependencies
- `@supabase/supabase-js` - Database & Auth
- `framer-motion` - Animations
- `lucide-react` - Icons
- `react-router-dom` - Routing
- `react-helmet-async` - SEO
- `tailwindcss` - Styling

This implementation provides a complete event-gallery system where events act as folders containing related images, with both inline viewing (Events page) and dedicated gallery browsing (Gallery page).