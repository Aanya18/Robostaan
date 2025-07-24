import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, Award, Eye } from 'lucide-react';
import { getSupabase } from '../lib/supabaseConnection';
import { useApp } from '../context/AppContext';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';

const GALLERY_BUCKET = 'gallery';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

const Gallery: React.FC = () => {
  const { isAdmin } = useApp();
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [captions, setCaptions] = useState<{ [key: string]: string }>({});

  // Fetch images from Supabase Storage using signed URLs
  const fetchImages = async () => {
    const supabase = await getSupabase();
    const { data, error } = await supabase.storage.from(GALLERY_BUCKET).list('', { limit: 100 });
    if (error) {
      setError('Failed to fetch images');
      return;
    }
    if (data) {
      const images = await Promise.all(
        data
          .filter((file: any) => file.name.match(/\.(jpg|jpeg|png|gif)$/i))
          .map(async (file: any) => {
            const { data: urlData } = await supabase.storage.from(GALLERY_BUCKET).createSignedUrl(file.name, 60 * 60); // 1 hour expiry
            return { url: urlData?.signedUrl || '', name: file.name };
          })
      );
      setImages(images);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line
  }, []);

  // Handle multiple image uploads
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setError(null);
    setSuccess(null);
    if (!files || files.length === 0) return;
    let anyError = false;
    setUploading(true);
    const supabase = await getSupabase();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPG, JPEG, PNG, and GIF files are allowed.');
        anyError = true;
        continue;
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(fileName, file);
      if (uploadError) {
        setError('Upload failed: ' + uploadError.message);
        anyError = true;
      }
    }
    setUploading(false);
    if (!anyError) {
      setSuccess('Images uploaded successfully!');
    }
    fetchImages();
  };

  // Delete image (admin only)
  const handleDelete = async (fileName: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    const supabase = await getSupabase();
    const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([fileName]);
    if (error) {
      setError('Delete failed: ' + error.message);
    } else {
      setSuccess('Image deleted successfully!');
      fetchImages();
    }
  };

  // Edit/replace image (admin only)
  const handleEdit = async (idx: number, file: File) => {
    setError(null);
    setSuccess(null);
    const oldFileName = images[idx].name;
    const supabase = await getSupabase();
    // Delete old image first
    await supabase.storage.from(GALLERY_BUCKET).remove([oldFileName]);
    // Upload new image with same name
    const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(oldFileName, file);
    if (uploadError) {
      setError('Edit failed: ' + uploadError.message);
    } else {
      setSuccess('Image replaced successfully!');
      fetchImages();
      setEditingIdx(null);
    }
  };

  // Caption change (in-memory only)
  const handleCaptionChange = (fileName: string, value: string) => {
    setCaptions((prev) => ({ ...prev, [fileName]: value }));
  };

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
          {/* Admin Upload Section */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <label className="block mb-2 font-semibold text-gray-900 dark:text-white">Upload Images</label>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/jpg,image/gif" 
                multiple 
                onChange={handleUpload} 
                disabled={uploading}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {uploading && <p className="text-orange-500 mt-2">Uploading...</p>}
              {error && <p className="text-red-500 font-medium mt-2">{error}</p>}
              {success && <p className="text-green-600 font-medium mt-2">{success}</p>}
            </motion.div>
          )}

          {/* Coming Soon Section */}
          {images.length === 0 && (
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
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full"
            >
              {images.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 relative group hover:shadow-lg transition-shadow duration-300"
                >
                  <img src={img.url} alt="Gallery image" className="w-full h-56 object-cover transition-transform duration-200 hover:scale-105" />
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="bg-red-500 text-white rounded p-1 hover:bg-red-600 transition-colors"
                        title="Delete"
                        onClick={() => handleDelete(img.name)}
                      >
                        🗑️
                      </button>
                      <label className="bg-blue-500 text-white rounded p-1 hover:bg-blue-600 cursor-pointer transition-colors" title="Edit">
                        ✏️
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) handleEdit(idx, e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  )}
                  {/* Caption field for admin */}
                  {isAdmin && (
                    <input
                      type="text"
                      className="w-full p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Add a caption (not saved)"
                      value={captions[img.name] || ''}
                      onChange={e => handleCaptionChange(img.name, e.target.value)}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Gallery; 