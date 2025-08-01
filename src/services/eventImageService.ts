// Event Image Service - Handles automatic gallery folder creation and image uploads
import { Event } from '../lib/supabaseService';

// Helper function to generate hash code for strings
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface EventImageUploadResult {
  success: boolean;
  uploadedImages: ImageUploadResult[];
  failedUploads: ImageUploadResult[];
  folderPath: string;
}

class EventImageService {
  private cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  private cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  constructor() {
    if (!this.cloudinaryCloudName || !this.cloudinaryUploadPreset) {
      console.error('❌ Cloudinary configuration missing. Please check your .env file for:');
      console.error('   - VITE_CLOUDINARY_CLOUD_NAME');
      console.error('   - VITE_CLOUDINARY_UPLOAD_PRESET');
    }
  }

  /**
   * Generate folder name from event title (uses eventService for consistency)
   */
  public generateFolderName(eventTitle: string): string {
    return eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  /**
   * Upload single image to specific event folder
   */
  public async uploadImageToEventFolder(
    file: File, 
    eventFolder: string,
    customFileName?: string
  ): Promise<ImageUploadResult> {
    console.log(`🔄 EventImageService: Uploading image to folder '${eventFolder}'`);
    console.log(`📁 File details:`, {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });

    try {
      if (!this.cloudinaryCloudName) {
        console.error('❌ Cloudinary cloud name is missing in environment variables');
        throw new Error('Cloudinary cloud name not configured');
      }

      if (!this.cloudinaryUploadPreset) {
        console.error('❌ Cloudinary upload preset is missing in environment variables');
        throw new Error('Cloudinary upload preset not configured');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.cloudinaryUploadPreset);
      formData.append('folder', `events/${eventFolder}`);
      
      if (customFileName) {
        formData.append('public_id', `${customFileName}_${Date.now()}`);
      }

      // Note: For unsigned uploads, optimization parameters like quality/format 
      // should be configured in the upload preset on Cloudinary dashboard
      
      console.log(`🚀 EventImageService: Sending upload request to Cloudinary...`);
      console.log(`   - Cloud: ${this.cloudinaryCloudName}`);
      console.log(`   - Preset: ${this.cloudinaryUploadPreset}`);
      console.log(`   - Folder: events/${eventFolder}`);
      console.log(`   - File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            // Remove Content-Type header to let the browser set it with boundary for FormData
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.error('❌ EventImageService: Cloudinary error details:', errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error('❌ EventImageService: Raw error response:', errorText);
          errorMessage = `HTTP ${response.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log(`✅ EventImageService: Image uploaded successfully:`, result.secure_url);

      // Track the uploaded image for fallback retrieval
      this.trackUploadedImage(eventFolder, {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width || 800,
        height: result.height || 600,
        format: result.format || 'jpg'
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };

    } catch (error: any) {
      console.error(`❌ EventImageService: Upload failed:`, error.message);
      
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple images to event folder
   */
  public async uploadImagesToEventFolder(
    files: FileList | File[], 
    eventFolder: string,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<EventImageUploadResult> {
    console.log(`🔄 EventImageService: Uploading ${files.length} images to folder '${eventFolder}'`);

    const uploadedImages: ImageUploadResult[] = [];
    const failedUploads: ImageUploadResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / totalFiles) * 100);
      
      console.log(`📤 EventImageService: Uploading ${i + 1}/${totalFiles}: ${file.name}`);
      
      if (onProgress) {
        onProgress(progress, file.name);
      }

      const result = await this.uploadImageToEventFolder(file, eventFolder);
      
      if (result.success) {
        uploadedImages.push(result);
      } else {
        failedUploads.push({
          success: false,
          error: result.error,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 EventImageService: Upload completed - Success: ${uploadedImages.length}, Failed: ${failedUploads.length}`);

    return {
      success: uploadedImages.length > 0,
      uploadedImages,
      failedUploads,
      folderPath: `events/${eventFolder}`,
    };
  }

  /**
   * Get images from event folder using Cloudinary Admin API or fallback
   */
  public async getEventImages(eventFolder: string): Promise<{ images: any[]; error: any }> {
    console.log(`🔍 EventImageService: Fetching images from folder '${eventFolder}'`);

    try {
      // Method 1: Try using backend API endpoint for Cloudinary Admin API
      try {
        const response = await fetch('/api/cloudinary/folder-images', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            folder: `events/${eventFolder}`,
            max_results: 50,
            resource_type: 'image'
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ EventImageService: Fetched ${result.resources?.length || 0} images from backend API`);
          
          return {
            images: result.resources || [],
            error: null,
          };
        } else {
          console.log(`⚠️ EventImageService: Backend API failed (${response.status}), trying direct approach...`);
        }
      } catch (backendError) {
        console.log(`⚠️ EventImageService: Backend API unavailable, trying direct approach...`);
      }

      // Method 2: Try using Cloudinary's direct API (if API key is available)
      if (import.meta.env.VITE_CLOUDINARY_API_KEY) {
        try {
          // Note: This approach has CORS limitations but might work in some cases
          const searchUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/resources/search`;
          
          const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(import.meta.env.VITE_CLOUDINARY_API_KEY + ':' + import.meta.env.VITE_CLOUDINARY_API_SECRET)}`
            },
            body: JSON.stringify({
              expression: `folder:events/${eventFolder}`,
              max_results: 50,
              sort_by: [["created_at", "desc"]]
            })
          });

          if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            console.log(`✅ EventImageService: Fetched ${searchResult.resources?.length || 0} images from direct API`);
            
            return {
              images: searchResult.resources || [],
              error: null,
            };
          }
        } catch (directError) {
          console.log(`⚠️ EventImageService: Direct API failed, using fallback...`);
        }
      }

      // Method 3: Try to get images using direct Cloudinary URL construction
      console.log(`🔄 EventImageService: Attempting to construct image URLs for folder '${eventFolder}'`);
      
      try {
        // Since we can't access Admin API, we'll try to construct likely image URLs
        // This is a fallback method that uses common image patterns
        const constructedImages = await this.constructImagesFromFolder(eventFolder);
        if (constructedImages.length > 0) {
          console.log(`✅ EventImageService: Found ${constructedImages.length} constructed images`);
          return {
            images: constructedImages,
            error: null,
          };
        }
      } catch (constructError) {
        console.warn(`⚠️ EventImageService: URL construction failed:`, constructError);
      }

      // Method 4: Use localStorage to track uploaded images as fallback
      try {
        const trackedImages = this.getTrackedImages(eventFolder);
        if (trackedImages.length > 0) {
          console.log(`📋 EventImageService: Using ${trackedImages.length} tracked images from localStorage`);
          return {
            images: trackedImages,
            error: null,
          };
        }
      } catch (trackingError) {
        console.warn(`⚠️ EventImageService: Image tracking failed:`, trackingError);
      }

      // Method 5: Last resort - return empty array
      console.log(`📭 EventImageService: No images found in folder '${eventFolder}' - returning empty array`);
      console.log(`⚠️ EventImageService: To see images in gallery, please upload them first using the admin panel`);
      
      return {
        images: [],
        error: null,
      };

    } catch (error: any) {
      console.error(`❌ EventImageService: Failed to fetch images:`, error.message);
      
      return {
        images: [],
        error: error.message,
      };
    }
  }

  /**
   * Create optimized image URL with transformations
   */
  public getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {}
  ): string {
    const {
      width = 800,
      height = 600,
      crop = 'fill',
      quality = 'auto:good',
      format = 'auto',
    } = options;

    return `https://res.cloudinary.com/${this.cloudinaryCloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
  }

  /**
   * Track uploaded images in localStorage for fallback retrieval
   */
  private trackUploadedImage(eventFolder: string, imageData: any): void {
    try {
      const storageKey = `robostaan_gallery_${eventFolder}`;
      const existingImages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add new image if not already exists
      const imageExists = existingImages.some((img: any) => img.public_id === imageData.public_id);
      if (!imageExists) {
        existingImages.push({
          public_id: imageData.public_id,
          secure_url: imageData.secure_url,
          width: imageData.width || 800,
          height: imageData.height || 600,
          format: imageData.format || 'jpg',
          created_at: new Date().toISOString(),
          resource_type: 'image',
          folder: `events/${eventFolder}`,
          uploaded_at: Date.now()
        });
        
        localStorage.setItem(storageKey, JSON.stringify(existingImages));
        console.log(`📋 EventImageService: Tracked image for ${eventFolder}:`, imageData.public_id);
      }
    } catch (error) {
      console.warn('Failed to track uploaded image:', error);
    }
  }

  /**
   * Get tracked images from localStorage
   */
  private getTrackedImages(eventFolder: string): any[] {
    try {
      const storageKey = `robostaan_gallery_${eventFolder}`;
      const trackedImages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Sort by upload time (newest first)
      return trackedImages.sort((a: any, b: any) => (b.uploaded_at || 0) - (a.uploaded_at || 0));
    } catch (error) {
      console.warn('Failed to get tracked images:', error);
      return [];
    }
  }

  /**
   * Construct likely image URLs based on common naming patterns
   */
  private async constructImagesFromFolder(eventFolder: string): Promise<any[]> {
    const potentialImages: any[] = [];
    
    // Common image naming patterns to try
    const commonPatterns = [
      'image_1', 'image_2', 'image_3', 'image_4', 'image_5',
      'photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5',
      'img_1', 'img_2', 'img_3', 'img_4', 'img_5',
      '1', '2', '3', '4', '5'
    ];

    // Test each potential URL
    for (let i = 0; i < commonPatterns.length; i++) {
      const pattern = commonPatterns[i];
      const testUrl = `https://res.cloudinary.com/${this.cloudinaryCloudName}/image/upload/events/${eventFolder}/${pattern}.jpg`;
      
      try {
        // Test if image exists by trying to load it
        const exists = await this.testImageUrl(testUrl);
        if (exists) {
          potentialImages.push({
            public_id: `events/${eventFolder}/${pattern}`,
            secure_url: testUrl,
            width: 800,
            height: 600,
            format: 'jpg',
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            resource_type: 'image',
            folder: eventFolder,
            constructed: true
          });
        }
      } catch (error) {
        // Ignore errors, just skip this pattern
      }
      
      // Limit testing to avoid too many requests
      if (potentialImages.length >= 5) break;
    }
    
    return potentialImages;
  }

  /**
   * Test if an image URL exists
   */
  private async testImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000);
    });
  }

  /**
   * Delete image from Cloudinary
   */
  public async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`🗑️ EventImageService: Deleting image '${publicId}'`);

    try {
      // Note: Deleting requires authentication with Cloudinary Admin API
      // This would typically be done on the backend
      console.log('⚠️ EventImageService: Image deletion requires backend implementation');
      
      return {
        success: false,
        error: 'Image deletion requires backend implementation',
      };

    } catch (error: any) {
      console.error(`❌ EventImageService: Delete failed:`, error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test upload and retrieve functionality
   */
  public async testUploadAndRetrieve(eventFolder: string): Promise<{
    uploadWorking: boolean;
    retrieveWorking: boolean;
    errors: string[];
    details: any;
  }> {
    console.log(`🧪 EventImageService: Testing upload/retrieve for folder '${eventFolder}'`);
    
    const errors: string[] = [];
    let uploadWorking = false;
    let retrieveWorking = false;
    const details: any = {};

    try {
      // Test 1: Check configuration
      if (!this.cloudinaryCloudName) {
        errors.push('Cloudinary cloud name not configured');
      }
      if (!this.cloudinaryUploadPreset) {
        errors.push('Cloudinary upload preset not configured');
      }

      details.configuration = {
        cloudName: !!this.cloudinaryCloudName,
        uploadPreset: !!this.cloudinaryUploadPreset,
        apiKey: !!import.meta.env.VITE_CLOUDINARY_API_KEY,
        apiSecret: !!import.meta.env.VITE_CLOUDINARY_API_SECRET
      };

      // Test 2: Try to retrieve existing images
      try {
        const { images, error } = await this.getEventImages(eventFolder);
        if (error) {
          errors.push(`Retrieve test failed: ${error}`);
        } else {
          retrieveWorking = true;
          details.retrieveTest = {
            success: true,
            imageCount: images.length,
            sampleImage: images[0]?.secure_url
          };
        }
      } catch (error: any) {
        errors.push(`Retrieve test exception: ${error.message}`);
        details.retrieveTest = { success: false, error: error.message };
      }

      // Test 3: Create a test image (1x1 pixel PNG)
      try {
        // Create a minimal test image
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(0, 0, 1, 1);
        }

        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });

        const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
        
        // Try to upload
        const uploadResult = await this.uploadImageToEventFolder(testFile, eventFolder);
        
        if (uploadResult.success) {
          uploadWorking = true;
          details.uploadTest = {
            success: true,
            imageUrl: uploadResult.url,
            publicId: uploadResult.publicId
          };
        } else {
          errors.push(`Upload test failed: ${uploadResult.error}`);
          details.uploadTest = { success: false, error: uploadResult.error };
        }

      } catch (error: any) {
        errors.push(`Upload test exception: ${error.message}`);
        details.uploadTest = { success: false, error: error.message };
      }

      // Test 4: Check if we can generate optimized URLs
      try {
        const testPublicId = `events/${eventFolder}/test-image`;
        const optimizedUrl = this.getOptimizedImageUrl(testPublicId, {
          width: 400,
          height: 300,
          quality: 'auto'
        });
        
        details.urlGeneration = {
          success: true,
          testUrl: optimizedUrl
        };
      } catch (error: any) {
        errors.push(`URL generation failed: ${error.message}`);
        details.urlGeneration = { success: false, error: error.message };
      }

      console.log('🧪 EventImageService: Test results:', {
        uploadWorking,
        retrieveWorking,
        errors,
        details
      });

      return {
        uploadWorking,
        retrieveWorking,
        errors,
        details
      };

    } catch (error: any) {
      console.error('🧪 EventImageService: Test failed:', error);
      errors.push(`Test framework error: ${error.message}`);
      
      return {
        uploadWorking: false,
        retrieveWorking: false,
        errors,
        details
      };
    }
  }

  /**
   * Clear tracked images for a specific event folder (for testing)
   */
  public clearTrackedImages(eventFolder: string): void {
    try {
      const storageKey = `robostaan_gallery_${eventFolder}`;
      localStorage.removeItem(storageKey);
      console.log(`🧹 EventImageService: Cleared tracked images for folder '${eventFolder}'`);
    } catch (error) {
      console.warn('Failed to clear tracked images:', error);
    }
  }

  /**
   * Get all tracked folders (for debugging)
   */
  public getAllTrackedFolders(): string[] {
    try {
      const trackedFolders: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('robostaan_gallery_')) {
          const folderName = key.replace('robostaan_gallery_', '');
          trackedFolders.push(folderName);
        }
      }
      return trackedFolders;
    } catch (error) {
      console.warn('Failed to get tracked folders:', error);
      return [];
    }
  }

  /**
   * Get service status and diagnostic information
   */
  public getServiceStatus(): {
    configured: boolean;
    cloudName: string;
    uploadPreset: string;
    hasApiCredentials: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!this.cloudinaryCloudName) {
      errors.push('VITE_CLOUDINARY_CLOUD_NAME is not configured');
    }
    
    if (!this.cloudinaryUploadPreset) {
      errors.push('VITE_CLOUDINARY_UPLOAD_PRESET is not configured');
    }

    return {
      configured: errors.length === 0,
      cloudName: this.cloudinaryCloudName || 'NOT_SET',
      uploadPreset: this.cloudinaryUploadPreset || 'NOT_SET',
      hasApiCredentials: !!(import.meta.env.VITE_CLOUDINARY_API_KEY && import.meta.env.VITE_CLOUDINARY_API_SECRET),
      errors
    };
  }
}

export const eventImageService = new EventImageService();
export default eventImageService;