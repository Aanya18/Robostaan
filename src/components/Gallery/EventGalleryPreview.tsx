// Event Gallery Preview Component - Shows uploaded images in Events page
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  ExternalLink,
  Camera,
  Plus,
  ArrowRight
} from 'lucide-react';

interface EventGalleryPreviewProps {
  images: any[];
  eventTitle: string;
  maxPreview?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const EventGalleryPreview: React.FC<EventGalleryPreviewProps> = ({
  images,
  eventTitle,
  maxPreview = 6,
  showViewAll = true,
  onViewAll
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No images uploaded yet
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Images will appear here once uploaded
        </p>
      </div>
    );
  }

  const previewImages = images.slice(0, maxPreview);
  const remainingCount = images.length - maxPreview;

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const downloadImage = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Camera className="w-4 h-4 mr-2" />
            Our Gallery ({images.length} images)
          </h4>
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center transition-colors"
            >
              {images.length > maxPreview ? 'View All' : 'Open Gallery'}
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {previewImages.map((image, index) => (
            <motion.div
              key={image.public_id || index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.secure_url}
                alt={`${eventTitle} - Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}

          {/* Show More Button */}
          {remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: maxPreview * 0.1 }}
              className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              onClick={onViewAll}
            >
              <div className="text-center text-white">
                <Plus className="w-8 h-8 mx-auto mb-1" />
                <span className="text-sm font-medium">+{remainingCount}</span>
                <p className="text-xs opacity-90">more</p>
              </div>
            </motion.div>
          )}
        </div>
from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"



      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 text-white hover:text-gray-300 z-10"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 text-white hover:text-gray-300 z-10"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImage(
                  images[currentImageIndex].secure_url,
                  `${eventTitle}-image-${currentImageIndex + 1}.jpg`
                );
              }}
              className="absolute bottom-4 right-4 bg-white bg-opacity-20 text-white hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>

            {/* Current Image */}
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[currentImageIndex].secure_url}
                alt={`${eventTitle} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg">
              {currentImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EventGalleryPreview;