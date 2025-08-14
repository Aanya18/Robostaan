// Event Service - Handles event operations with Cloudinary folder integration
import { cloudinaryService } from './cloudinaryService';
import supabaseService, { Event } from '../lib/supabaseService';

export interface EventCreateData {
  title: string;
  description?: string;
  cloudinary_folder: string;
  date?: string;
  location?: string;
  event_type?: string;
  image_url?: string;
  tags?: string[];
  is_featured?: boolean;
}

export interface EventUpdateData {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  event_type?: string;
  image_url?: string;
  tags?: string[];
  is_featured?: boolean;
}

export interface EventWithImageCount extends Event {
  image_count: number;
}

class EventService {
  /**
   * Get all events with optional filtering
   */
  async getEvents(options: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    tags?: string[];
    search?: string;
  } = {}): Promise<{ data: Event[]; error: any }> {
    try {
      const result = await supabaseService.getEvents(options);
      return result;
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(limit: number = 3): Promise<{ data: Event[]; error: any }> {
    try {
      const result = await supabaseService.getFeaturedEvents(limit);
      return result;
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<{ data: Event | null; error: any }> {
    return await supabaseService.getEventById(id);
  }

  /**
   * Get event by Cloudinary folder name
   */
  async getEventByFolder(cloudinaryFolder: string): Promise<{ data: Event | null; error: any }> {
    return await supabaseService.getEventByFolder(cloudinaryFolder);
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: EventCreateData): Promise<{ success: boolean; data?: Event; error?: string }> {
    try {
      // Validate required fields
      if (!eventData.title || !eventData.cloudinary_folder) {
        return {
          success: false,
          error: 'Title and Cloudinary folder are required'
        };
      }

      // Check if folder name already exists
      const { data: existingEvent } = await supabaseService.getEventByFolder(eventData.cloudinary_folder);
      if (existingEvent) {
        return {
          success: false,
          error: 'An event with this folder name already exists'
        };
      }

      const eventToCreate: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
        title: eventData.title,
        description: eventData.description,
        cloudinary_folder: eventData.cloudinary_folder,
        date: eventData.date,
        location: eventData.location,
        image_url: eventData.image_url,
        tags: eventData.tags || [],
        is_featured: eventData.is_featured || false,
        created_by: undefined, // Will be set by RLS policies
      };

      const { data: event, error } = await supabaseService.createEvent(eventToCreate);

      if (error) {

        return {
          success: false,
          error: `Failed to create event: ${error.message || error}`
        };
      }



      return {
        success: true,
        data: event!
      };

    } catch (error: any) {

      return {
        success: false,
        error: error.message || 'Failed to create event'
      };
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    updates: EventUpdateData
  ): Promise<{ success: boolean; data?: Event; error?: string }> {
    try {
      const updateData: Partial<Event> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.is_featured !== undefined) updateData.is_featured = updates.is_featured;

      const { data, error } = await supabaseService.updateEvent(eventId, updateData);

      if (error) {
        return {
          success: false,
          error: 'Failed to update event'
        };
      }

      return {
        success: true,
        data: data!
      };

    } catch (error: any) {

      return {
        success: false,
        error: error.message || 'Failed to update event'
      };
    }
  }

  /**
   * Delete an event
   * Note: This doesn't delete the Cloudinary folder - admin must do that manually
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseService.deleteEvent(eventId);
      
      if (error) {
        return {
          success: false,
          error: 'Failed to delete event from database'
        };
      }

      return { success: true };

    } catch (error: any) {

      return {
        success: false,
        error: error.message || 'Failed to delete event'
      };
    }
  }

  /**
   * Generate folder name from event title
   */
  generateFolderName(eventTitle: string): string {
    return eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  /**
   * Get all event folders for gallery organization
   */
  async getEventFolders(): Promise<{ data: string[]; error: any }> {
    return await supabaseService.getEventFolders();
  }

  /**
   * Get events with image counts from their Cloudinary folders
   */
  async getEventsWithImageCounts(): Promise<{ data: EventWithImageCount[]; error: any }> {
    try {
      const { data: events, error } = await this.getEvents();
      
      if (error || !events) {
        return { data: [], error };
      }

      // For each event, get the image count from Cloudinary
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          try {
            // Try to get folder info from Cloudinary
            const images = await cloudinaryService.searchImages({
              folder: event.cloudinary_folder,
              max_results: 1 // We just need the count, not all images
            });
            
            return {
              ...event,
              image_count: images.total_count || 0
            };
          } catch (error) {

            return {
              ...event,
              image_count: 0
            };
          }
        })
      );

      return { data: eventsWithCounts, error: null };
    } catch (error: any) {

      return { data: [], error: error.message };
    }
  }

  /**
   * Get images from a specific event's Cloudinary folder
   */
  async getEventImages(cloudinaryFolder: string, options: {
    max_results?: number;
    next_cursor?: string;
  } = {}) {
    try {
      return await cloudinaryService.getFolderImages(cloudinaryFolder, {
        max_results: options.max_results || 30,
        next_cursor: options.next_cursor
      });
    } catch (error: any) {

      throw error;
    }
  }

  /**
   * Upload multiple images to an event's Cloudinary folder
   */
  async uploadEventImages(
    eventId: string,
    files: File[],
    options: {
      onProgress?: (completed: number, total: number) => void;
      onImageUploaded?: (result: any, index: number) => void;
    } = {}
  ): Promise<{ success: boolean; uploadedImages: any[]; errors: string[] }> {
    try {
      // First get the event to find its Cloudinary folder
      const { data: event, error: eventError } = await this.getEventById(eventId);
      if (eventError || !event) {
        return {
          success: false,
          uploadedImages: [],
          errors: ['Event not found']
        };
      }

      const uploadedImages: any[] = [];
      const errors: string[] = [];

      // Upload images one by one
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          
          // Validate file
          const validation = cloudinaryService.validateFile(file);
          if (!validation.valid) {
            errors.push(`File ${file.name}: ${validation.error}`);
            continue;
          }

          // Upload to event's folder
          const result = await cloudinaryService.uploadImage(file, {
            folder: event.cloudinary_folder,
            tags: ['event-gallery', `event-${eventId}`, event.title.toLowerCase().replace(/\s+/g, '-')],
            public_id: `${event.cloudinary_folder}/${Date.now()}_${i}_${file.name.split('.')[0]}`
          });

          uploadedImages.push(result);
          
          // Call progress callback
          if (options.onProgress) {
            options.onProgress(i + 1, files.length);
          }

          // Call individual image upload callback
          if (options.onImageUploaded) {
            options.onImageUploaded(result, i);
          }

          console.log(`✅ Uploaded image ${i + 1}/${files.length}:`, result.secure_url);

        } catch (error: any) {
          console.error(`❌ Failed to upload ${files[i].name}:`, error);
          errors.push(`${files[i].name}: ${error.message}`);
        }
      }

      return {
        success: uploadedImages.length > 0,
        uploadedImages,
        errors
      };

    } catch (error: any) {
      console.error('💥 Bulk upload error:', error);
      return {
        success: false,
        uploadedImages: [],
        errors: [error.message || 'Failed to upload images']
      };
    }
  }

  /**
   * Upload a single cover image and update event record
   */
  async uploadEventCoverImage(
    eventId: string,
    file: File
  ): Promise<{ success: boolean; coverUrl?: string; error?: string }> {
    try {
      // Get the event
      const { data: event, error: eventError } = await this.getEventById(eventId);
      if (eventError || !event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // Validate file
      const validation = cloudinaryService.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Upload cover image
      const result = await cloudinaryService.uploadImage(file, {
        folder: event.cloudinary_folder,
        tags: ['event-cover', `event-${eventId}`, 'cover-image'],
        public_id: `${event.cloudinary_folder}/cover_${Date.now()}`
      });

      // Update event with new cover image URL
      const updateResult = await this.updateEvent(eventId, {
        image_url: result.secure_url
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: 'Failed to update event with cover image URL'
        };
      }

      return {
        success: true,
        coverUrl: result.secure_url
      };

    } catch (error: any) {
      console.error('❌ Cover image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload cover image'
      };
    }
  }

  /**
   * Create event with automatic folder generation and optional cover image
   */
  async createEventWithImages(
    eventData: EventCreateData,
    coverImage?: File,
    galleryImages?: File[]
  ): Promise<{ success: boolean; data?: Event; error?: string; uploadResults?: any }> {
    try {
      // Auto-generate folder name if not provided
      if (!eventData.cloudinary_folder && eventData.title) {
        eventData.cloudinary_folder = this.generateFolderName(eventData.title);
      }

      // Create the event first
      const createResult = await this.createEvent(eventData);
      if (!createResult.success || !createResult.data) {
        return createResult;
      }

      const event = createResult.data;
      let finalCoverUrl = eventData.image_url;
      const uploadResults: any = {
        coverImage: null,
        galleryImages: [],
        errors: []
      };

      // Upload cover image if provided
      if (coverImage) {
        const coverResult = await this.uploadEventCoverImage(event.id, coverImage);
        if (coverResult.success) {
          finalCoverUrl = coverResult.coverUrl;
          uploadResults.coverImage = coverResult;
        } else {
          uploadResults.errors.push(`Cover image: ${coverResult.error}`);
        }
      }

      // Upload gallery images if provided
      if (galleryImages && galleryImages.length > 0) {
        const galleryResult = await this.uploadEventImages(event.id, galleryImages);
        uploadResults.galleryImages = galleryResult.uploadedImages;
        uploadResults.errors.push(...galleryResult.errors);
      }

      return {
        success: true,
        data: {
          ...event,
          image_url: finalCoverUrl
        },
        uploadResults
      };

    } catch (error: any) {
      console.error('💥 Event creation with images error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create event with images'
      };
    }
  }

  /**
   * Search events by various criteria
   */
  async searchEvents(query: string): Promise<{ data: Event[]; error: any }> {
    return await this.getEvents({ search: query, limit: 50 });
  }



  /**
   * Validate event data
   */
  validateEventData(data: EventCreateData): { valid: boolean; error?: string } {
    if (!data.title || data.title.trim().length === 0) {
      return { valid: false, error: 'Event title is required' };
    }

    if (data.title.trim().length > 255) {
      return { valid: false, error: 'Event title is too long (max 255 characters)' };
    }

    if (!data.cloudinary_folder || data.cloudinary_folder.trim().length === 0) {
      return { valid: false, error: 'Cloudinary folder name is required' };
    }

    // Validate folder name format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(data.cloudinary_folder)) {
      return { 
        valid: false, 
        error: 'Folder name can only contain lowercase letters, numbers, and hyphens' 
      };
    }

    if (data.date && isNaN(Date.parse(data.date))) {
      return { valid: false, error: 'Invalid date format' };
    }

    return { valid: true };
  }
}

export const eventService = new EventService();