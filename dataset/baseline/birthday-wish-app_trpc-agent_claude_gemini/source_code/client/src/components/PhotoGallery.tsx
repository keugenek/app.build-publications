import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Photo {
  id: number;
  url: string;
  caption: string;
  alt: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  title?: string;
}

export function PhotoGallery({ photos, title = "Photo Gallery" }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});

  const handleImageLoad = (photoId: number) => {
    setImageLoading(prev => ({ ...prev, [photoId]: false }));
  };

  const handleImageError = (photoId: number) => {
    setImageLoading(prev => ({ ...prev, [photoId]: false }));
    console.log(`Failed to load image for photo ${photoId}`);
  };

  return (
    <>
      <Card className="shadow-2xl border-4 border-indigo-200 bg-gradient-to-r from-indigo-50 to-pink-50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-indigo-700 flex items-center justify-center gap-2">
            📸 {title} 📸
          </CardTitle>
          <p className="text-indigo-600 mt-2">Click on any photo to see it larger!</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                onClick={() => setSelectedPhoto(photo.id)}
              >
                <div className="relative overflow-hidden rounded-xl shadow-lg border-3 border-white bg-gray-100">
                  {/* Loading skeleton */}
                  {imageLoading[photo.id] !== false && (
                    <div className="w-full h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
                  )}
                  
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className={`w-full h-64 object-cover group-hover:brightness-110 transition-all duration-300 ${
                      imageLoading[photo.id] !== false ? 'hidden' : 'block'
                    }`}
                    onLoad={() => handleImageLoad(photo.id)}
                    onError={() => handleImageError(photo.id)}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-medium text-sm">{photo.caption}</p>
                    </div>
                  </div>
                  
                  {/* Hover overlay icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded-full p-3 text-2xl">🔍</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 modal-backdrop"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 rounded-full w-10 h-10 p-0 bg-white text-black hover:bg-gray-200 z-10 shadow-lg"
            >
              ✕
            </Button>
            {photos
              .filter(photo => photo.id === selectedPhoto)
              .map(photo => (
                <div key={photo.id} className="text-center">
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  />
                  <p className="text-white mt-4 text-lg font-medium">{photo.caption}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
