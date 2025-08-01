// Event Image Uploader Component
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Eye,
  Trash2
} from 'lucide-react';
import { eventImageService, EventImageUploadResult, ImageUploadResult } from '../../services/eventImageService';
import { Event } from '../../lib/supabaseService';

interface EventImageUploaderProps {
  // New interface
  eventFolder?: string;
  eventTitle?: string;
  onImagesUploaded?: (results: EventImageUploadResult) => void;
  maxImages?: number;
  existingImages?: string[];
  
  // Legacy interface (for backward compatibility)
  event?: Event;
  onUploadComplete?: (uploadedImages: any[], errors: string[]) => void;
  onCoverImageUpdate?: (imageUrl: string) => void;
}

interface UploadProgress {
  progress: number;
  currentFile: string;
  isUploading: boolean;
}

const EventImageUploader: React.FC<EventImageUploaderProps> = ({
  // New interface props
  eventFolder: propEventFolder,
  eventTitle: propEventTitle,
  onImagesUploaded,
  maxImages = 20,
  existingImages = [],
  
  // Legacy interface props
  event,
  onUploadComplete,
  onCoverImageUpdate
}) => {
  // Determine which props to use (new interface takes precedence)
  const eventFolder = propEventFolder || event?.cloudinary_folder || '';
  const eventTitle = propEventTitle || event?.title || '';
  const isLegacyMode = !!event && !propEventFolder;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    currentFile: '',
    isUploading: false
  });
  const [uploadResults, setUploadResults] = useState<EventImageUploadResult | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate previews when files are selected
  const generatePreviews = (files: File[]) => {
    const newPreviews: string[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total images limit
    const totalImages = existingImages.length + selectedFiles.length + validFiles.length;
    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed. You can add ${maxImages - existingImages.length - selectedFiles.length} more images.`);
      return;
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    generatePreviews(newFiles);
    setUploadResults(null);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  // Upload images
  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      console.log('No files selected');
      return;
    }

    if (!eventFolder) {
      console.error('Event folder is not specified');
      return;
    }

    setUploadProgress({ progress: 0, currentFile: '', isUploading: true });

    try {
      console.log(`Starting upload of ${selectedFiles.length} files to folder: ${eventFolder}`);
      
      const results = await eventImageService.uploadImagesToEventFolder(
        selectedFiles,
        eventFolder,
        (progress, currentFile) => {
          setUploadProgress({
            progress,
            currentFile,
            isUploading: true
          });
        }
      );

      setUploadResults(results);
      setUploadProgress({ progress: 100, currentFile: '', isUploading: false });

      // Clear selected files on successful upload
      if (results.success && results.failedUploads.length === 0) {
        setSelectedFiles([]);
        setPreviews([]);
      }

      // Handle both callback interfaces
      if (onImagesUploaded) {
        onImagesUploaded(results);
      }
      
      // Legacy callback support
      if (isLegacyMode && onUploadComplete) {
        const uploadedImages = results.uploadedImages.map(img => ({
          url: img.url,
          publicId: img.publicId
        }));
        const errors = results.failedUploads.map(fail => fail.error || 'Upload failed');
        onUploadComplete(uploadedImages, errors);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ progress: 0, currentFile: '', isUploading: false });
    }
  };

  // Clear all
  const clearAll = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setUploadResults(null);
    setUploadProgress({ progress: 0, currentFile: '', isUploading: false });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Camera className="w-5 h-5 mr-2 text-blue-500" />
            Gallery Images
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload images for <span className="font-medium">{eventTitle}</span> gallery
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Folder: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-blue-600">events/{eventFolder}</code>
          </p>
        </div>
        {selectedFiles.length > 0 && !uploadProgress.isUploading && (
          <button
            onClick={clearAll}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Clear all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Upload Event Images
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop your images here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Select Images
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Maximum {maxImages} images, up to 10MB each
          </p>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Selected Images ({selectedFiles.length})
            </h4>
            {!uploadProgress.isUploading && (
              <button
                onClick={uploadImages}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {!uploadProgress.isUploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress.isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center mb-3">
              <Loader className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Uploading Images...
              </span>
            </div>
            
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
              <span>{uploadProgress.currentFile}</span>
              <span>{uploadProgress.progress}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Results */}
      {uploadResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {uploadResults.success ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Upload Completed!
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Successfully uploaded {uploadResults.uploadedImages.length} images to gallery.
                {uploadResults.failedUploads.length > 0 && 
                  ` ${uploadResults.failedUploads.length} uploads failed.`
                }
              </p>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="font-medium text-red-800 dark:text-red-200">
                  Upload Failed
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                All uploads failed. Please check your connection and try again.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Existing Images Count */}
      {existingImages.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📸 This event already has {existingImages.length} image(s) in the gallery
          </p>
        </div>
      )}
    </div>
  );
};

export default EventImageUploader;