import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabaseConnection';
import { useApp } from '../context/AppContext';

const GALLERY_BUCKET = 'gallery';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

const Gallery: React.FC = () => {
  const { isAdmin } = useApp();
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Handle image upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, JPEG, PNG, and GIF files are allowed.');
      return;
    }
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const supabase = await getSupabase();
    const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(fileName, file);
    setUploading(false);
    if (uploadError) {
      setError('Upload failed. Please try again.');
    } else {
      setSuccess('Image uploaded successfully!');
      fetchImages();
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">Our Gallery</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl">
        Explore our gallery of excellence where every image tells a story.
      </p>
      {isAdmin && (
        <div className="mb-8 w-full max-w-md mx-auto">
          <label className="block mb-2 font-semibold">Upload Image</label>
          <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif" onChange={handleUpload} disabled={uploading} />
          {uploading && <p className="text-orange-500">Uploading...</p>}
          {error && <p className="text-red-500 font-medium mt-2">{error}</p>}
          {success && <p className="text-green-600 font-medium mt-2">{success}</p>}
        </div>
      )}
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16">
          <span className="text-6xl text-gray-300 mb-4">🖼️</span>
          <h2 className="text-2xl font-semibold mb-2">No images found</h2>
          <p className="text-gray-500">Check back later for new images.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {images.map((img, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
              <img src={img.url} alt="Gallery image" className="w-full h-56 object-cover transition-transform duration-200 hover:scale-105" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery; 