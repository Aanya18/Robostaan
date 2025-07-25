// Gallery Service - Combines Cloudinary and Supabase operations
import { cloudinaryService, CloudinaryUploadResponse } from './cloudinaryService';
import supabaseService, { GalleryImage } from '../lib/supabaseService';

export interface GalleryUploadOptions {
  title?: string;
  description?: string;
  tags?: string[];
  isFeatured?: boolean;
  displayOrder?: number;
}

export interface GalleryUploadResult {
  success: boolean;
  data?: GalleryImage;
  error?: string;
  cloudinaryData?: CloudinaryUploadResponse;
}

export interface GalleryBatchUploadResult {
  success: boolean;
  results: GalleryUploadResult[];
  successCount: number;
  errorCount: number;
}

class GalleryService {
  /**
   * Upload a single image following the flow:
   * 1. Upload to Cloudinary
   * 2. Save metadata to Supabase
   */
  async uploadImage(
    file: File,
    options: GalleryUploadOptions = {}
  ): Promise<GalleryUploadResult> {
    try {
      // Step 1: Validate file
      const validation = cloudinaryService.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Step 2: Upload to Cloudinary
      const cloudinaryResult = await cloudinaryService.uploadImage(file, {
        folder: 'gallery',
        tags: ['gallery', ...(options.tags || [])]
        // Note: quality and format parameters are not allowed with unsigned uploads
        // These should be configured in the upload preset instead
      });

      // Step 3: Save metadata to Supabase
      const galleryImageData: Omit<GalleryImage, 'id' | 'created_at' | 'updated_at'> = {
        title: options.title || file.name.split('.')[0],
        description: options.description,
        cloudinary_url: cloudinaryResult.url,
        cloudinary_public_id: cloudinaryResult.public_id,
        cloudinary_secure_url: cloudinaryResult.secure_url,
        tags: options.tags || [],
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        file_size: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
        uploaded_by: undefined, // Will be set by RLS policies
        is_featured: options.isFeatured || false,
        display_order: options.displayOrder || 0
      };

      console.log('Attempting to save to database:', galleryImageData);
      const { data: galleryImage, error: supabaseError } = await supabaseService.createGalleryImage(galleryImageData);

      if (supabaseError) {
        console.error('Failed to save image metadata to database:', supabaseError);
        console.error('Supabase error details:', JSON.stringify(supabaseError, null, 2));
        // Optionally delete from Cloudinary if database save fails
        // await cloudinaryService.deleteImage(cloudinaryResult.public_id);
        return {
          success: false,
          error: `Failed to save image metadata to database: ${supabaseError.message || supabaseError}`,
          cloudinaryData: cloudinaryResult
        };
      }

      console.log('Successfully saved to database:', galleryImage);

      return {
        success: true,
        data: galleryImage!,
        cloudinaryData: cloudinaryResult
      };

    } catch (error: any) {
      console.error('Gallery upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  }

  /**
   * Upload multiple images in batch
   */
  async uploadMultipleImages(
    files: File[],
    options: GalleryUploadOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<GalleryBatchUploadResult> {
    const results: GalleryUploadResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.uploadImage(file, {
          ...options,
          title: options.title || `${file.name.split('.')[0]}_${Date.now()}_${i}`
        });

        results.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        if (onProgress) {
          onProgress(i + 1, files.length);
        }

      } catch (error: any) {
        results.push({
          success: false,
          error: error.message || 'Failed to upload image'
        });
        errorCount++;
        
        if (onProgress) {
          onProgress(i + 1, files.length);
        }
      }
    }

    return {
      success: successCount > 0,
      results,
      successCount,
      errorCount
    };
  }

  /**
   * Get all gallery images from Supabase
   */
  async getGalleryImages(options: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    tags?: string[];
    search?: string;
  } = {}): Promise<{ data: GalleryImage[]; error: any }> {
    console.log('Fetching gallery images with options:', options);
    const result = await supabaseService.getGalleryImages(options);
    console.log('Gallery images fetch result:', result);
    
    if (result.error) {
      console.error('Error fetching gallery images:', result.error);
    } else {
      console.log(`Successfully fetched ${result.data?.length || 0} images`);
    }
    
    return result;
  }

  /**
   * Delete an image (from both Cloudinary and Supabase)
   */
  async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the image data to get the Cloudinary public_id
      const { data: image, error: fetchError } = await supabaseService.getGalleryImageById(imageId);
      
      if (fetchError || !image) {
        return {
          success: false,
          error: 'Image not found in database'
        };
      }

      // Delete from Supabase first
      const { error: dbError } = await supabaseService.deleteGalleryImage(imageId);
      
      if (dbError) {
        return {
          success: false,
          error: 'Failed to delete image from database'
        };
      }

      // Then try to delete from Cloudinary (optional - can fail silently)
      try {
        await cloudinaryService.deleteImage(image.cloudinary_public_id);
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary, but database deletion succeeded:', cloudinaryError);
      }

      return { success: true };

    } catch (error: any) {
      console.error('Delete image error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image'
      };
    }
  }

  /**
   * Update image metadata
   */
  async updateImage(
    imageId: string,
    updates: {
      title?: string;
      description?: string;
      tags?: string[];
      isFeatured?: boolean;
      displayOrder?: number;
    }
  ): Promise<{ success: boolean; data?: GalleryImage; error?: string }> {
    try {
      const updateData: Partial<GalleryImage> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
      if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

      const { data, error } = await supabaseService.updateGalleryImage(imageId, updateData);

      if (error) {
        return {
          success: false,
          error: 'Failed to update image metadata'
        };
      }

      return {
        success: true,
        data: data!
      };

    } catch (error: any) {
      console.error('Update image error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update image'
      };
    }
  }

  /**
   * Generate responsive URLs for an image
   */
  generateResponsiveUrls(publicId: string) {
    return cloudinaryService.generateResponsiveUrls(publicId);
  }

  /**
   * Generate transformation URL
   */
  generateTransformationUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      effect?: string;
    } = {}
  ) {
    return cloudinaryService.generateTransformationUrl(publicId, transformations);
  }

  /**
   * Reorder gallery images
   */
  async reorderImages(imageUpdates: { id: string; displayOrder: number }[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseService.updateGalleryImageOrder(imageUpdates);
      
      if (error) {
        return {
          success: false,
          error: 'Failed to update image order'
        };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Reorder images error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reorder images'
      };
    }
  }
}

export const galleryService = new GalleryService();