import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface GalleryImage {
  id: number;
  url: string;
  altText: string;
  caption: string;
}

interface PhotoGalleryProps {
  images: GalleryImage[];
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          🖼️ Birthday Memories 🖼️
        </h2>
        <p className="text-lg text-gray-600">
          A collection of joyful moments to celebrate this special day
        </p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image, index) => (
          <Dialog key={image.id}>
            <DialogTrigger asChild>
              <Card className={`
                group cursor-pointer transform transition-all duration-500 
                hover:scale-105 hover:shadow-2xl 
                bg-white/90 backdrop-blur-sm border-0 shadow-lg
                animate-fade-in-up
              `}
              style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-0 relative overflow-hidden rounded-lg">
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.altText}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-medium text-sm">
                          Click to view full size
                        </p>
                      </div>
                    </div>

                    {/* Decorative corner elements */}
                    <div className="absolute top-2 right-2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-bounce">
                      🔍
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50">
                    <p className="text-center font-medium text-gray-700 flex items-center justify-center gap-2">
                      <span>{image.caption}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>

            {/* Full Size Image Dialog */}
            <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-0 shadow-none">
              <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full max-h-[80vh] object-contain"
                  />
                  
                  {/* Caption overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <p className="text-white text-lg font-medium text-center">
                      {image.caption}
                    </p>
                    <p className="text-white/80 text-sm text-center mt-1">
                      {image.altText}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Gallery Footer */}
      <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
        <div className="flex items-center justify-center gap-2 text-lg text-gray-600 mb-2">
          <span>📸</span>
          <span>Capturing precious moments</span>
          <span>📸</span>
        </div>
        <p className="text-sm text-gray-500">
          Each photo tells a story of joy, love, and celebration
        </p>
      </div>
    </div>
  );
}
