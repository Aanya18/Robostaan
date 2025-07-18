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
    <div className="min-h-[70vh] flex flex-col items-center justify-start py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">Our Gallery</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl">
        Explore our gallery of excellence where every image tells a story.
      </p>
      {isAdmin && (
        <div className="mb-8 w-full max-w-md mx-auto">
          <label className="block mb-2 font-semibold">Upload Image</label>
          <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif" multiple onChange={handleUpload} disabled={uploading} />
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
            <div key={idx} className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900 relative group">
              <img src={img.url} alt="Gallery image" className="w-full h-56 object-cover transition-transform duration-200 hover:scale-105" />
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="bg-red-500 text-white rounded p-1 hover:bg-red-600"
                    title="Delete"
                    onClick={() => handleDelete(img.name)}
                  >
                    🗑️
                  </button>
                  <label className="bg-blue-500 text-white rounded p-1 hover:bg-blue-600 cursor-pointer" title="Edit">
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
                  className="w-full p-2 border-t text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800"
                  placeholder="Add a caption (not saved)"
                  value={captions[img.name] || ''}
                  onChange={e => handleCaptionChange(img.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery; 