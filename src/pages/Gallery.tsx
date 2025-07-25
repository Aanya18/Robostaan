import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, Award, Eye, Upload, X, Edit3, Star, Trash2 } from 'lucide-react';
import { galleryService } from '../services/galleryService';
import supabaseService, { GalleryImage } from '../lib/supabaseService';
import { useApp } from '../context/AppContext';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';

const Gallery: React.FC = () => {
  const { isAdmin } = useApp();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state for editing
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    tags: '',
    isFeatured: false
  });

  // Fetch images from Supabase database
  const fetchImages = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching images from database...');
      
      // Test most direct connection possible
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        
        console.log('🌐 Supabase config:', {
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        });
        
        const { data: directData, error: directError } = await supabase
          .from('gallery_images')
          .select('*')
          .limit(10);
        
        console.log('🧪 Most direct test:', { 
          directData, 
          directError, 
          count: directData?.length,
          firstItem: directData?.[0]
        });
        
        if (directData && directData.length > 0) {
          // If we got data, use it!
          setImages(directData);
          console.log('✅ SUCCESS: Using direct data, found', directData.length, 'images');
          return;
        }
        
      } catch (directErr) {
        console.log('🔬 Direct connection error:', directErr);
      }
      
      // Fallback to service layers
      const { data: testData, error: testError } = await supabaseService.getGalleryImages({ limit: 100 });
      console.log('🧪 SupabaseService test:', { testData, testError, count: testData?.length });
      
      const { data, error } = await galleryService.getGalleryImages({ limit: 100 });
      console.log('📊 GalleryService result:', { data, error, count: data?.length });
      
      if (error) {
        setError(`Failed to fetch images: ${JSON.stringify(error)}`);
        console.error('❌ Fetch images error:', error);
      } else {
        console.log('✅ Fetched images:', data);
        setImages(data || []);
        if (data && data.length > 0) {
          console.log('📝 Sample image data:', data[0]);
        } else {
          console.log('📭 No images found in database');
        }
      }
    } catch (err: any) {
      setError(`Failed to fetch images: ${err.message}`);
      console.error('❌ Fetch images error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Handle multiple image uploads with progress
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setSuccess(null);
    setUploading(true);
    setUploadProgress({ completed: 0, total: files.length });

    try {
      const fileArray = Array.from(files);
      
      const result = await galleryService.uploadMultipleImages(
        fileArray,
        {
          tags: ['gallery', 'upload'],
          displayOrder: images.length
        },
        (completed, total) => {
          setUploadProgress({ completed, total });
        }
      );

      if (result.success) {
        setSuccess(`Successfully uploaded ${result.successCount} image(s)${result.errorCount > 0 ? `, ${result.errorCount} failed` : ''}`);
        await fetchImages(); // Refresh the gallery
      } else {
        setError(`Upload failed: ${result.errorCount} error(s)`);
      }

    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress({ completed: 0, total: 0 });
      // Clear the file input
      e.target.value = '';
    }
  };

  // Handle image deletion
  const handleDelete = async (image: GalleryImage) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const result = await galleryService.deleteImage(image.id);
      
      if (result.success) {
        setSuccess('Image deleted successfully');
        await fetchImages(); // Refresh the gallery
      } else {
        setError(result.error || 'Failed to delete image');
      }
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  // Handle edit modal
  const openEditModal = (image: GalleryImage) => {
    setEditingImage(image);
    setEditForm({
      title: image.title || '',
      description: image.description || '',
      tags: image.tags.join(', '),
      isFeatured: image.is_featured
    });
  };

  const closeEditModal = () => {
    setEditingImage(null);
    setEditForm({ title: '', description: '', tags: '', isFeatured: false });
  };

  // Handle image update
  const handleUpdate = async () => {
    if (!editingImage) return;

    try {
      const result = await galleryService.updateImage(editingImage.id, {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isFeatured: editForm.isFeatured
      });

      if (result.success) {
        setSuccess('Image updated successfully');
        closeEditModal();
        await fetchImages(); // Refresh the gallery
      } else {
        setError(result.error || 'Failed to update image');
      }
    } catch (err: any) {
      setError(`Update failed: ${err.message}`);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <>
      <SEOHead
        title="Gallery | ROBOSTAAN"
        description="Explore our gallery showcasing robotics projects, events, and achievements. Witness the journey of innovation and excellence."
        keywords={["robotics gallery", "projects showcase", "technology images", "STEM gallery", "robotics achievements"]}
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Gallery
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore our gallery of excellence where every image tells a story of innovation and achievement.
            </p>
          </motion.div>

          {/* Status Messages */}
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 mx-2 sm:mx-0"
            >
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p className="font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  <p className="font-medium">{success}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Admin Upload Section */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Images
              </h3>
              
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" 
                multiple 
                onChange={handleUpload} 
                disabled={uploading}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              
              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Uploading images...</span>
                    <span>{uploadProgress.completed}/{uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Supports JPEG, PNG, GIF, WebP. Max 10MB per file.
              </p>
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
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading images...</p>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && images.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 sm:p-8 text-center text-white mb-8 mx-2 sm:mx-0"
            >
              <div className="max-w-4xl mx-auto">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h2 className="text-2xl font-bold mb-3">Amazing Gallery Coming Soon!</h2>
                <p className="text-base mb-6 opacity-90">
                  Stunning visuals of our robotics journey are being curated!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center mb-2">
                      <Image className="w-5 h-5 mr-2" />
                      <h3 className="font-semibold">Project Showcases</h3>
                    </div>
                    <p className="text-sm opacity-90">Visual project documentation</p>
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
          )}

          {/* Gallery Grid */}
          {!loading && images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full"
            >
              {images.map((image, idx) => {
                // Debug: Log each image data
                console.log(`🖼️ Rendering image ${idx + 1}:`, {
                  id: image.id,
                  title: image.title,
                  cloudinary_public_id: image.cloudinary_public_id,
                  cloudinary_url: image.cloudinary_url,
                  cloudinary_secure_url: image.cloudinary_secure_url
                });
                
                return (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 relative group hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Featured badge */}
                  {image.is_featured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center z-10">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </div>
                  )}

                  {/* Image */}
                  <div className="w-full h-64 overflow-hidden">
                    {image.cloudinary_public_id ? (
                      <img 
                        src={galleryService.generateTransformationUrl(image.cloudinary_public_id, {
                          width: 400,
                          height: 400,
                          crop: 'fill',
                          gravity: 'center'
                        })} 
                        alt={image.title || 'Gallery image'}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          console.log('Image load error for:', image.cloudinary_public_id);
                          e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                        }}
                      />
                    ) : image.cloudinary_url ? (
                      <img 
                        src={image.cloudinary_url} 
                        alt={image.title || 'Gallery image'}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          console.log('Image load error for URL:', image.cloudinary_url);
                          e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                          <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Missing Image URL</p>
                          <p className="text-xs text-gray-400">ID: {image.id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600 transition-colors"
                        title="Edit"
                        onClick={() => openEditModal(image)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="bg-red-500 text-white rounded p-2 hover:bg-red-600 transition-colors"
                        title="Delete"
                        onClick={() => handleDelete(image)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}


                </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Edit Modal */}
          {editingImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Edit Image
                    </h2>
                    <button
                      onClick={closeEditModal}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter image title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter image description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={editForm.isFeatured}
                        onChange={(e) => setEditForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="featured" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Featured image
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={closeEditModal}
                        className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Gallery;