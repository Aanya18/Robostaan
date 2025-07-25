// Cloudinary Service for handling image uploads
// This service handles client-side uploads to Cloudinary

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
  etag: string;
  placeholder?: boolean;
  resource_type: string;
  type: string;
  version: number;
  version_id: string;
  signature: string;
  folder?: string;
  tags?: string[];
}

export interface CloudinaryError {
  message: string;
  name: string;
  http_code: number;
}

class CloudinaryService {
  private readonly cloudName: string;
  private readonly uploadPreset: string;
  private readonly apiKey: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

    if (!this.cloudName || !this.uploadPreset) {
      throw new Error(
        'Missing Cloudinary configuration. Please check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.'
      );
    }
  }

  /**
   * Upload a single file to Cloudinary
   */
  async uploadImage(
    file: File,
    options: {
      folder?: string;
      tags?: string[];
      transformation?: string;
      public_id?: string;
      overwrite?: boolean;
      quality?: string | number;
      format?: string;
      eager?: string[];
    } = {}
  ): Promise<CloudinaryUploadResponse> {
    try {
      const formData = new FormData();
      
      // Required fields
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      // Optional parameters
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      if (options.public_id) {
        formData.append('public_id', options.public_id);
      }

      // Note: The following parameters are not allowed with unsigned uploads
      // These should be configured in the upload preset instead:
      // - quality, format, overwrite, eager
      
      // if (options.overwrite !== undefined) {
      //   formData.append('overwrite', options.overwrite.toString());
      // }

      // if (options.quality) {
      //   formData.append('quality', options.quality.toString());
      // }

      // if (options.format) {
      //   formData.append('format', options.format);
      // }

      // if (options.eager && options.eager.length > 0) {
      //   formData.append('eager', options.eager.join('|'));
      // }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
      }

      const result: CloudinaryUploadResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleImages(
    files: File[],
    options: {
      folder?: string;
      tags?: string[];
      transformation?: string;
      quality?: string | number;
      format?: string;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<CloudinaryUploadResponse[]> {
    const results: CloudinaryUploadResponse[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadImage(files[i], {
          ...options,
          public_id: `${Date.now()}_${i}` // Ensure unique public_id
        });
        results.push(result);
        
        if (options.onProgress) {
          options.onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error);
        // Continue with other files, but track the error
        throw error;
      }
    }

    return results;
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      // Note: For client-side deletion, you'll need to set up a server endpoint
      // or use Cloudinary's signed deletion. This is a placeholder.
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Generate a transformation URL for an image
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
      overlay?: string;
      gravity?: string;
    } = {}
  ): string {
    let transformationString = '';
    
    const params: string[] = [];
    
    if (transformations.width) params.push(`w_${transformations.width}`);
    if (transformations.height) params.push(`h_${transformations.height}`);
    if (transformations.crop) params.push(`c_${transformations.crop}`);
    if (transformations.quality) params.push(`q_${transformations.quality}`);
    if (transformations.format) params.push(`f_${transformations.format}`);
    if (transformations.effect) params.push(`e_${transformations.effect}`);
    if (transformations.overlay) params.push(`l_${transformations.overlay}`);
    if (transformations.gravity) params.push(`g_${transformations.gravity}`);
    
    if (params.length > 0) {
      transformationString = params.join(',') + '/';
    }

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformationString}${publicId}`;
  }

  /**
   * Generate optimized URLs for different screen sizes
   */
  generateResponsiveUrls(publicId: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    
    return {
      thumbnail: `${baseUrl}/w_150,h_150,c_fill,q_auto,f_auto/${publicId}`,
      small: `${baseUrl}/w_400,h_300,c_fill,q_auto,f_auto/${publicId}`,
      medium: `${baseUrl}/w_800,h_600,c_fill,q_auto,f_auto/${publicId}`,
      large: `${baseUrl}/w_1200,h_900,c_fill,q_auto,f_auto/${publicId}`,
      original: `${baseUrl}/q_auto,f_auto/${publicId}`
    };
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 10MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Generate upload signature (requires server-side implementation)
   */
  async generateSignature(params: Record<string, any>): Promise<string> {
    const response = await fetch('/api/cloudinary/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to generate upload signature');
    }

    const { signature } = await response.json();
    return signature;
  }
}

export const cloudinaryService = new CloudinaryService();