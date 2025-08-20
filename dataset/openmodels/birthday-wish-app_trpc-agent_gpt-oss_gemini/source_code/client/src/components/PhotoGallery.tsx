import React from 'react';

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {photos.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Memory ${idx + 1}`}
          className="w-full h-auto rounded-md object-cover"
        />
      ))}
    </div>
  );
}
