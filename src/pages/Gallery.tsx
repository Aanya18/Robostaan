import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Camera, Image, Award, Eye, Upload, X, Edit3, Star, Trash2, Folder, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { eventService } from '../services/eventService';
import { eventImageService } from '../services/eventImageService';
import { Event } from '../lib/supabaseService';
import { useApp } from '../context/AppContext';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';

interface GalleryImages {
  [eventId: string]: {
    images: any[];
    loading: boolean;
    hasMore: boolean;
    nextCursor?: string;
  };
}

const Gallery: React.FC = () => {
  const { isAdmin } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventImages, setEventImages] = useState<GalleryImages>({});
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'gallery'>('folders');

  // Fetch events (folders) from Supabase
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching events for gallery...');
      
      const { data, error } = await eventService.getEvents({ limit: 50 });
      
      if (error) {
        setError(`Failed to fetch events: ${JSON.stringify(error)}`);
        console.error('❌ Fetch events error:', error);
      } else {
        console.log('✅ Fetched events:', data);
        setEvents(data || []);
        console.log(`📝 Found ${data?.length || 0} events/folders`);
      }
    } catch (err: any) {
      setError(`Failed to fetch events: ${err.message}`);
      console.error('❌ Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle URL parameters to auto-navigate to specific event
  useEffect(() => {
    const eventId = searchParams.get('event');
    const eventFolder = searchParams.get('folder');
    
    if (eventId && events.length > 0) {
      console.log(`🔗 Gallery: URL parameter detected - Event ID: ${eventId}, Folder: ${eventFolder}`);
      
      // Find the event by ID
      const targetEvent = events.find(event => event.id === eventId);
      
      if (targetEvent) {
        console.log(`✅ Gallery: Found target event: ${targetEvent.title}`);
        console.log(`📁 Gallery: Cloudinary folder: ${targetEvent.cloudinary_folder}`);
        
        // Set the selected event and switch to gallery view
        setSelectedEvent(targetEvent);
        setViewMode('gallery');
        
        // Load images for this event
        loadEventImages(targetEvent);
        
        // Update URL to clean version (optional)
        // navigate('/gallery', { replace: true });
      } else {
        console.warn(`⚠️ Gallery: Event with ID ${eventId} not found in events list`);
        console.log(`📝 Gallery: Available events:`, events.map(e => ({ id: e.id, title: e.title })));
      }
    }
  }, [events, searchParams]);

  // Load images for a specific event folder
  const loadEventImages = async (event: Event) => {
    // If already loaded or loading, don't fetch again
    if (eventImages[event.id]?.images.length > 0 || eventImages[event.id]?.loading) {
      return;
    }

    setEventImages(prev => ({
      ...prev,
      [event.id]: {
        images: [],
        loading: true,
        hasMore: true
      }
    }));

    try {
      console.log(`🖼️ Gallery.tsx: Loading images for "${event.title}" (folder: ${event.cloudinary_folder})`);
      
      // Use the new eventImageService
      const { images, error } = await eventImageService.getEventImages(event.cloudinary_folder);

      if (error) {
        console.error(`❌ Gallery.tsx: Error loading images for ${event.title}:`, error);
      } else {
        console.log(`✅ Gallery.tsx: Loaded ${images.length} images for ${event.title}`);
      }

      setEventImages(prev => ({
        ...prev,
        [event.id]: {
          images: images || [],
          loading: false,
          hasMore: false,
          nextCursor: undefined
        }
      }));
    } catch (error) {
      console.error(`💥 Gallery.tsx: Exception loading images for ${event.title}:`, error);
      setEventImages(prev => ({
        ...prev,
        [event.id]: {
          images: [],
          loading: false,
          hasMore: false
        }
      }));
    }
  };

  // Handle folder click
  const handleFolderClick = async (event: Event) => {
    console.log(`📁 Gallery: Opening gallery for event: ${event.title} (ID: ${event.id})`);
    console.log(`🗂️ Gallery: Cloudinary folder: ${event.cloudinary_folder}`);
    
    setSelectedEvent(event);
    setViewMode('gallery');
    
    // Update URL with event parameters
    navigate(`/gallery?event=${event.id}&folder=${event.cloudinary_folder}`, { replace: true });
    
    await loadEventImages(event);
  };

  // Handle back to folders
  const handleBackToFolders = () => {
    console.log('🔙 Gallery: Navigating back to folders view');
    setSelectedEvent(null);
    setViewMode('folders');
    
    // Clear URL parameters when going back to folders
    navigate('/gallery', { replace: true });
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <>
      <SEOHead
        title="Gallery | ROBOSTAAN"
        description="Explore our event-based gallery showcasing robotics projects, workshops, and achievements. Browse by event folders to see images."
        keywords={["robotics gallery", "event photos", "projects showcase", "technology images", "STEM gallery", "robotics achievements"]}
        image={siteConfig.seo.defaultImage}
        url={urlHelpers.fullUrl('/gallery')}
        type="website"
      />
      <div className="min-h-screen bg-white dark:bg-gray-900 py-6 px-2 sm:py-8 sm:px-4">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            {viewMode === 'folders' ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Our Gallery
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                 Explore our gallery of excellence where every image tells a story of innovation and achievement.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center mb-4">
                  <button
                    onClick={handleBackToFolders}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Events</span>
                  </button>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    {selectedEvent?.title}
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Photo gallery from {selectedEvent?.title}
                  {selectedEvent?.date && ` • ${formatDate(selectedEvent.date)}`}
                </p>
              </>
            )}
          </motion.div>

          {/* Error Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 mx-2 sm:mx-0"
            >
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {viewMode === 'folders' ? 'Loading events...' : 'Loading images...'}
              </p>
            </motion.div>
          )}

          {/* Folders View */}
          {viewMode === 'folders' && !loading && (
            <>
              {events.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 sm:p-8 text-center text-white mb-8 mx-2 sm:mx-0"
                >
                  <div className="max-w-4xl mx-auto">
                    <Folder className="w-12 h-12 mx-auto mb-4 opacity-90" />
                    <h2 className="text-2xl font-bold mb-3">No Events Found!</h2>
                    <p className="text-base mb-6 opacity-90">
                      Event galleries will appear here once events are created by admins.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center mb-2">
                          <Image className="w-5 h-5 mr-2" />
                          <h3 className="font-semibold">Event Photos</h3>
                        </div>
                        <p className="text-sm opacity-90">Photos organized by events</p>
                      </div>
                      
                      <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center mb-2">
                          <Award className="w-5 h-5 mr-2" />
                          <h3 className="font-semibold">Achievement Moments</h3>
                        </div>
                        <p className="text-sm opacity-90">Milestone celebrations</p>
                      </div>
                      
                      <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center mb-2">
                          <Eye className="w-5 h-5 mr-2" />
                          <h3 className="font-semibold">Behind the Scenes</h3>
                        </div>
                        <p className="text-sm opacity-90">Creative process glimpses</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {events.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      onClick={() => handleFolderClick(event)}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    >
                      {/* Event Cover Image */}
                      <div className="relative">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <Folder className="w-16 h-16 text-white opacity-80" />
                          </div>
                        )}
                      </div>

                      {/* Simple Event Info */}
                      <div className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-3">
                          {event.title}
                        </h3>
                        
                        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                          <Folder className="w-4 h-4 mr-2" />
                          <span>Click to view gallery</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}

          {/* Gallery View */}
          {viewMode === 'gallery' && selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {eventImages[selectedEvent.id]?.loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading gallery images...</p>
                  </div>
                </div>
              ) : eventImages[selectedEvent.id]?.images.length === 0 ? (
                <div className="text-center py-20">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                    No images found in this event gallery
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    Folder: <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">{selectedEvent.cloudinary_folder}</code>
                  </p>
                  {isAdmin && (
                    <div className="inline-flex items-center px-4 py-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <Upload className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                      <span className="text-sm text-orange-700 dark:text-orange-300">
                        Use Admin Panel → Events → Manage Images to upload photos for this event
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {eventImages[selectedEvent.id]?.images.map((image: any, idx: number) => (
                    <motion.div
                      key={image.public_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 group cursor-pointer hover:shadow-xl transition-all duration-300"
                    >
                      <img
                        src={image.secure_url}
                        alt={`${selectedEvent.title} - Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          console.log('Image load error for:', image.public_id);
                          e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Gallery;