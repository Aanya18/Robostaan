import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Star, 
  ArrowLeft, 
  Tag,
  Award
} from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';
import DirectEventService from '../services/directEventService';
import { Event } from '../lib/supabaseService';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetail(id);
    }
  }, [id]);

  const fetchEventDetail = async (eventId: string) => {
    try {
      setLoading(true);
      console.log(`🔍 EventDetail: Fetching event details for ID: ${eventId}`);
      
      // Get single event by ID
      const { data, error } = await DirectEventService.getEventById(eventId);
      
      if (error) {
        console.error('❌ EventDetail: Error fetching event:', error);
        setError('Failed to load event details');
        return;
      }

      if (data) {
        console.log('✅ EventDetail: Event loaded:', data);
        setEvent(data);
      } else {
        setError('Event not found');
      }
    } catch (err: any) {
      console.error('💥 EventDetail: Exception:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGalleryClick = () => {
    if (event) {
      console.log(`🖼️ EventDetail: Navigating to gallery for event: ${event.title}`);
      navigate(`/gallery?event=${event.id}&folder=${event.cloudinary_folder}`);
    }
  };

  const handleBackClick = () => {
    navigate('/events');
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event details...</p>
        </div>
      </motion.div>
    );
  }

  if (error || !event) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Event not found'}
          </h2>
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${event.title} | Events | ROBOSTAAN`}
        description={event.description || `Join us for ${event.title} - an exciting robotics event.`}
        keywords={[
          event.title,
          'robotics event',
          'workshop',
          'technology',
          'STEM',
          'community',
          ...(event.tags || [])
        ]}
        image={event.image_url || siteConfig.seo.defaultImage}
        url={urlHelpers.fullUrl(`/events/${event.id}`)}
        type="article"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to All Events
            </button>
          </div>
        </div>

        {/* Event Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Event Cover Image */}
            {event.image_url && (
              <div className="w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Content */}
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Event Header */}
              <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {event.is_featured && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <Award className="w-3 h-3 mr-1" />
                      Event
                    </span>
                  </div>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {event.title}
                </h1>
              </header>

              {/* Event Meta Information */}
              <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {event.date && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Calendar className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(event.date)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(event.date)}
                      </p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Location</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}

                {event.event_type && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Award className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Event Type</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium capitalize">
                        {event.event_type}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Description */}
              {event.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    About This Event
                  </h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Event Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900 dark:hover:text-orange-200 transition-colors"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Link */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Event Gallery
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      View photos and moments from this event
                    </p>
                  </div>
                  <button
                    onClick={handleGalleryClick}
                    className="inline-flex items-center px-4 py-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                  >
                    View Gallery
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </>
  );
};

export default EventDetail;