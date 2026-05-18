'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/utils/apiClient';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  folder?: 'subjects' | 'courses' | 'questions' | 'chapters';
  className?: string;
  userId?: string;
}

export function ImageUploader({ onImageUpload, folder = 'subjects', className = '', userId }: ImageUploaderProps) {
  // Keeps upload UI state local while delegating storage work to the API client.
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Validates the selected image and prepares a browser preview before upload.
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    // Sends the selected file to the backend upload pipeline.
    if (!fileInputRef.current?.files?.[0]) {
      setError('Please select an image');
      return;
    }

    const file = fileInputRef.current.files[0];
    setUploading(true);
    setError('');

    try {
      // Ensure userId is set for authentication
      if (userId) {
        apiClient.setUserId(userId);
      }

      // Upload through the API client so the backend controls storage paths and auth.
      const response = await apiClient.upload.image(file, folder);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Upload failed');
      }

      onImageUpload(response.data!.imageUrl);
      setPreview(null);
      setUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    // Clears the current preview and file input without touching storage.
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center">
        {preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto h-24 w-24 object-cover rounded-lg"
            />
            <p className="text-xs text-slate-500">Preview</p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer space-y-1 py-4"
          >
            <p className="text-sm font-medium text-slate-900">Click to select image</p>
            <p className="text-xs text-slate-500">JPG, PNG, WebP or GIF (Max 5MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {preview && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
