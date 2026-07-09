'use client';

import { ImageIcon, Upload } from 'lucide-react';

interface PhotoUploadGridProps {
  photos: (string | null)[];
  onPhotoChange: (index: number, dataUrl: string | null) => void;
}

export default function PhotoUploadGrid({ photos, onPhotoChange }: PhotoUploadGridProps) {
  const handleFile = (index: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onPhotoChange(index, reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {photos.map((photo, index) => (
        <div key={index} className="relative aspect-square">
          {photo ? (
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 group">
              {/* Local file preview is a base64 data: URL — next/image can't optimize those, so a plain img is correct. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onPhotoChange(index, null)}
                className="absolute top-2 right-2 bg-white/90 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          ) : index === 0 ? (
            <label className="flex flex-col items-center justify-center w-full h-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 cursor-pointer hover:border-brand-primary hover:bg-blue-50/30 transition-colors">
              <Upload className="w-6 h-6 text-brand-primary mb-2" />
              <span className="text-xs font-medium text-brand-primary">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                title={`Upload photo ${index + 1}`}
                aria-label={`Upload photo ${index + 1}`}
                onChange={(e) => handleFile(index, e.target.files?.[0])}
              />
            </label>
          ) : (
            <label className="flex items-center justify-center w-full h-full rounded-xl bg-gray-100 border border-gray-200 cursor-pointer hover:bg-gray-200/80 transition-colors">
              <ImageIcon className="w-8 h-8 text-gray-300" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                title={`Upload photo ${index + 1}`}
                aria-label={`Upload photo ${index + 1}`}
                onChange={(e) => handleFile(index, e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
