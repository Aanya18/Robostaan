import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Folder,
  Tag,
  Upload,
  Shield
} from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';
import DirectEventService from '../services/directEventService';
import { Event } from '../lib/supabaseService';
import { useAuth } from '../components/Auth/AuthProvider';
import { eventService, EventCreateData } from '../services/eventService';
import { cloudinaryService } from '../services/cloudinaryService';
import EventImageUploader from '../components/Admin/EventImageUploader';

// Removed FilterOptions interface - filters removed for now

interface EventFormDraft {
  title: string;
  description: string;
  cloudinary_folder: string;
  date: string;
  location: string;
  event_type: string;
  image_url: string;
  tags: string;
  is_featured: boolean;
  editingEventId?: string;
  timestamp: number;
}

// Draft storage keys
const DRAFT_KEY = 'robostaan_event_draft';
const DRAFT_EXPIRY_DAYS = 7;

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin event management state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    cloudinary_folder: '',
    date: '',
    location: '',
    event_type: '',
    image_url: '',
    tags: '',
    is_featured: false
  });
  const [eventMessage, setEventMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Removed filter useEffect - filters removed for now

  // Clear messages after 5 seconds
  useEffect(() => {
    if (eventMessage) {
      const timer = setTimeout(() => setEventMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [eventMessage]);

  // Check for existing draft on component mount
  useEffect(() => {
    if (isAdmin) {
      checkForDraft();
    }
  }, [isAdmin]);

  // Auto-save draft when form changes
  useEffect(() => {
    if (isAdmin && showEventModal && (eventForm.title.trim() || eventForm.description.trim())) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [eventForm, showEventModal, isAdmin]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Events: Starting to fetch events...');
      
      const allEventsResult = await DirectEventService.getEvents({ limit: 50 });
      console.log('📊 Events: All Events Result:', allEventsResult);

      if (allEventsResult.data && Array.isArray(allEventsResult.data)) {
        console.log(`✅ Events: Setting ${allEventsResult.data.length} events`);
        setEvents(allEventsResult.data);
      } else {
        console.log('❌ Events: No events data found');
        setEvents([]);
      }

    } catch (error) {
      console.error('💥 Events: Critical error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      console.log('🏁 Events: Fetch completed');
    }
  };

  // Removed applyFilters function - filters removed for now

  // Draft management functions
  const saveDraft = () => {
    try {
      const draft: EventFormDraft = {
        ...eventForm,
        editingEventId: editingEvent?.id,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
      console.log('📝 Event draft saved');
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
    }
  };

  const loadDraft = (): EventFormDraft | null => {
    try {
      const draftData = localStorage.getItem(DRAFT_KEY);
      if (!draftData) return null;

      const draft: EventFormDraft = JSON.parse(draftData);
      
      // Check if draft is expired (older than DRAFT_EXPIRY_DAYS)
      const now = Date.now();
      const draftAge = now - draft.timestamp;
      const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      
      if (draftAge > maxAge) {
        clearDraft();
        return null;
      }

      return draft;
    } catch (error) {
      console.error('❌ Failed to load draft:', error);
      return null;
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setLastSaved(null);
      console.log('🗑️ Event draft cleared');
    } catch (error) {
      console.error('❌ Failed to clear draft:', error);
    }
  };

  const checkForDraft = () => {
    const draft = loadDraft();
    setHasDraft(!!draft);
  };

  const getDraftAge = (): string => {
    const draft = loadDraft();
    if (!draft) return '';
    
    const now = Date.now();
    const ageMs = now - draft.timestamp;
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);
    
    if (ageMinutes < 1) return 'just now';
    if (ageMinutes < 60) return `${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`;
    if (ageHours < 24) return `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`;
    return `${ageDays} day${ageDays === 1 ? '' : 's'} ago`;
  };

  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      console.log('📄 Restoring event draft...');
      
      // If draft was for editing a specific event, try to find it
      let eventToEdit: Event | null = null;
      if (draft.editingEventId) {
        eventToEdit = events.find(e => e.id === draft.editingEventId) || null;
      }

      setEditingEvent(eventToEdit);
      setEventForm({
        title: draft.title,
        description: draft.description,
        cloudinary_folder: draft.cloudinary_folder,
        date: draft.date,
        location: draft.location,
        event_type: draft.event_type,
        image_url: draft.image_url,
        tags: draft.tags,
        is_featured: draft.is_featured
      });
      setShowEventModal(true);
      setEventMessage({ 
        type: 'success', 
        text: eventToEdit ? 'Draft restored for editing event' : 'Draft restored for new event' 
      });
    }
  };

  // Admin event management functions
  const openEventModal = (event?: Event) => {
    // Only admin can access event management
    if (!isAdmin) {
      setEventMessage({ type: 'error', text: 'You do not have permission to manage events.' });
      return;
    }

    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || '',
        cloudinary_folder: event.cloudinary_folder,
        date: event.date ? event.date.split('T')[0] : '',
        location: event.location || '',
        event_type: event.event_type || '',
        image_url: event.image_url || '',
        tags: event.tags.join(', '),
        is_featured: event.is_featured
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        cloudinary_folder: '',
        date: '',
        location: '',
        event_type: '',
        image_url: '',
        tags: '',
        is_featured: false
      });
    }
    setShowEventModal(true);
    setEventMessage(null);
  };

  const resetEventForm = (clearDraftData = false) => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      cloudinary_folder: '',
      date: '',
      location: '',
      event_type: '',
      image_url: '',
      tags: '',
      is_featured: false
    });
    setEventMessage(null);
    
    if (clearDraftData) {
      clearDraft();
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only admin can submit events
    if (!isAdmin) {
      setEventMessage({ type: 'error', text: 'You do not have permission to manage events.' });
      return;
    }
    
    try {
      const cloudinaryFolder = eventForm.cloudinary_folder || 
                             eventService.generateFolderName(eventForm.title);
      
      const eventData: EventCreateData = {
        title: eventForm.title,
        description: eventForm.description || undefined,
        cloudinary_folder: cloudinaryFolder,
        date: eventForm.date || undefined,
        location: eventForm.location || undefined,
        event_type: eventForm.event_type || undefined,
        image_url: eventForm.image_url || undefined,
        tags: eventForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        is_featured: eventForm.is_featured
      };

      if (editingEvent) {
        const { success, error } = await eventService.updateEvent(editingEvent.id, eventData);
        if (success) {
          console.log('✅ Event updated successfully');
          setEventMessage({ type: 'success', text: 'Event updated successfully!' });
        } else {
          throw new Error(error || 'Failed to update event');
        }
      } else {
        const { success, error } = await eventService.createEvent(eventData);
        if (success) {
          console.log('✅ Event created successfully');
          setEventMessage({ type: 'success', text: 'Event created successfully!' });
        } else {
          throw new Error(error || 'Failed to create event');
        }
      }

      // Refresh events
      await fetchEvents();
      
      // Clear draft and close modal after delay
      setTimeout(() => {
        resetEventForm(true); // Clear draft on successful submission
      }, 1500);

    } catch (error: any) {
      console.error('❌ Event submission error:', error);
      setEventMessage({ type: 'error', text: error.message || 'Failed to save event' });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    console.log('🗑️ Delete button clicked for event:', eventId);
    console.log('🔐 User admin status:', isAdmin);
    console.log('👤 Current user:', user);

    if (!isAdmin) {
      setEventMessage({ type: 'error', text: 'You do not have permission to delete events.' });
      return;
    }

    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    try {
      setDeletingEventId(eventId);
      console.log('🔄 Attempting to delete event with ID:', eventId);
      const { success, error } = await eventService.deleteEvent(eventId);
      
      console.log('📊 Delete result:', { success, error });
      
      if (success) {
        console.log('✅ Event deleted successfully');
        setEventMessage({ type: 'success', text: 'Event deleted successfully!' });
        await fetchEvents();
      } else {
        console.error('❌ Delete failed:', error);
        throw new Error(error || 'Failed to delete event');
      }
    } catch (error: any) {
      console.error('💥 Delete event error:', error);
      setEventMessage({ type: 'error', text: error.message || 'Failed to delete event' });
    } finally {
      setDeletingEventId(null);
    }
  };

  // Removed openImageUploader - images now uploaded directly in event form

  const generateFolderName = () => {
    if (eventForm.title) {
      const folderName = eventService.generateFolderName(eventForm.title);
      setEventForm(prev => ({ ...prev, cloudinary_folder: folderName }));
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingCoverImage(true);
      console.log('🔄 Uploading cover image:', file.name);
      
      const result = await cloudinaryService.uploadImage(file, {
        folder: eventForm.cloudinary_folder || 'event-covers',
        tags: ['event-cover', 'admin-upload']
      });

      console.log('✅ Cover image uploaded:', result);
      
      setEventForm(prev => ({ 
        ...prev, 
        image_url: result.secure_url 
      }));
      
      setEventMessage({ type: 'success', text: 'Cover image uploaded successfully!' });
      
    } catch (error: any) {
      console.error('❌ Cover image upload failed:', error);
      setEventMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setUploadingCoverImage(false);
    }
  };

  // Removed handleCoverImageUpdate - now integrated in event form

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  const getEventTypeOptions = () => {
    // Predefined event types
    const predefinedTypes = [
      'meetup',
      'workshop', 
      'webinar',
      'event',
      'competition',
      'hackathon',
      'seminar',
      'conference'
    ];
    
    // Get types from existing events
    const existingTypes = events.map(event => event.event_type).filter(Boolean);
    
    // Combine and deduplicate
    const allTypes = [...new Set([...predefinedTypes, ...existingTypes])];
    
    return allTypes.sort();
  };

  return (
    <>
      <SEOHead
        title="Events | ROBOSTAAN"
        description="Join our exciting robotics events, workshops, and community meetups. Learn, network, and grow with fellow robotics enthusiasts."
        keywords={["robotics events", "workshops", "meetups", "community", "technology events", "STEM", "networking"]}
        image={siteConfig.seo.defaultImage}
        url={urlHelpers.fullUrl('/events')}
        type="website"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Events
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Join our exciting robotics events, workshops, and community meetups. 
                Discover learning opportunities and connect with fellow enthusiasts.
              </p>

            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
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

          {/* Search and Filter Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Events
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {events.length} events
                </span>

              </div>
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex items-center space-x-3">
                  {/* Draft Notification */}
                  {hasDraft && (
                    <button
                      onClick={restoreDraft}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-300 dark:border-blue-700 transition-all duration-200"
                      title={`You have an unsaved event draft from ${getDraftAge()}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 2v4h8V8H6z"/>
                      </svg>
                      <span className="text-sm font-medium">Restore Draft</span>
                    </button>
                  )}
                  
                  {/* Add Event Button */}
                  <button
                    onClick={() => openEventModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search and Filter sections removed - will add back later */}
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
            </motion.div>
          )}

          {/* Events Grid */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {events.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Stay tuned for upcoming events!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative h-full flex flex-col cursor-pointer"
                    >
                      {/* Event Image */}
                      <div className="relative">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white opacity-80" />
                          </div>
                        )}
                        {event.is_featured && (
                          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Featured
                          </div>
                        )}
                        
                        {/* Admin Controls Overlay */}
                        {isAdmin && (
                          <div className="absolute top-4 right-4 flex space-x-2 bg-black/50 rounded-lg p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventModal(event);
                              }}
                              className="p-2 text-white hover:text-orange-400 transition-colors"
                              title="Edit event"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              disabled={deletingEventId === event.id}
                              className={`p-2 text-white transition-colors ${
                                deletingEventId === event.id 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:text-red-400'
                              }`}
                              title={deletingEventId === event.id ? "Deleting..." : "Delete event"}
                            >
                              {deletingEventId === event.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-6 flex flex-col h-full">
                        {/* Event Type & Folder Info */}
                        <div className="flex items-center justify-between mb-3">
                          {event.event_type && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium capitalize">
                              {event.event_type}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {event.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 2 && (
                              <span className="text-gray-500 text-xs">+{event.tags.length - 2} more</span>
                            )}
                          </div>
                        )}

                        {/* Event Title */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 h-14 overflow-hidden">
                          {event.title}
                        </h3>
                        
                        {/* Event Description */}
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 h-10 overflow-hidden">
                            {event.description}
                          </p>
                        )}

                        {/* Event Footer */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
                          <div className="flex items-center space-x-4">
                            {event.date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(event.date)}</span>
                              </div>
                            )}
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1 text-orange-500">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium truncate max-w-[100px]">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

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
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {editingEvent ? 'Edit Event' : 'Create New Event'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Auto-saving as draft...'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Clear Draft Button */}
                    {(eventForm.title.trim() || eventForm.description.trim()) && (
                      <button
                        onClick={() => {
                          if (confirm('Clear draft? All unsaved changes will be lost.')) {
                            clearDraft();
                            resetEventForm();
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        title="Clear draft"
                      >
                        Clear Draft
                      </button>
                    )}
                    
                    {/* Close Button */}
                    <button
                      onClick={() => resetEventForm(false)} // Don't clear draft on close
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
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
                      {getEventTypeOptions().map(type => (
                        <option key={type} value={type} className="capitalize">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={eventForm.tags}
                      onChange={(e) => setEventForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="robotics, workshop, learning"
                    />
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
                    
                    {/* Upload Options */}
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
                          <div className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            {uploadingCoverImage ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Upload Image</span>
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
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eventForm.is_featured}
                        onChange={(e) => setEventForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Featured Event</span>
                    </label>
                  </div>

                  {/* Gallery Images Upload */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Gallery Images
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload multiple images for the event gallery. Images will be stored in the Cloudinary folder.
                      </p>
                    </div>
                    
                    {eventForm.cloudinary_folder ? (
                      <EventImageUploader
                        eventFolder={eventForm.cloudinary_folder}
                        eventTitle={eventForm.title || "New Event"}
                        onImagesUploaded={(results) => {
                          if (results.success) {
                            setEventMessage({ 
                              type: 'success', 
                              text: `Successfully uploaded ${results.uploadedImages.length} images to gallery!` 
                            });
                          } else {
                            setEventMessage({ 
                              type: 'error', 
                              text: 'Some images failed to upload' 
                            });
                          }
                        }}
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          Please enter an event title first to enable gallery uploads
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          The event title will be used to generate a Cloudinary folder name
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => resetEventForm(false)} // Don't clear draft on cancel
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                  
                  {eventMessage && (
                    <div className={`p-4 rounded-xl border mt-4 ${
                      eventMessage.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                    }`}>
                      {eventMessage.text}
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Image Uploader Modal removed - now integrated in event form */}
      </div>
    </>
  );
};

export default Events;