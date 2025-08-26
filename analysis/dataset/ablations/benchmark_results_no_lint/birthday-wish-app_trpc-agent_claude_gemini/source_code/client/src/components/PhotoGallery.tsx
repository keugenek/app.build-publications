import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Photo, AddPhotoInput } from '../../../server/src/schema';

interface PhotoGalleryProps {
  cardId: number;
  theme: string;
}

export function PhotoGallery({ cardId, theme }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder photo data since we don't have actual photo handlers
  const placeholderPhotos = [
    { emoji: '🎂', caption: 'Birthday Cake Moment', color: 'from-pink-400 to-red-400' },
    { emoji: '🎁', caption: 'Unwrapping Surprises', color: 'from-blue-400 to-purple-400' },
    { emoji: '🎈', caption: 'Party Decorations', color: 'from-green-400 to-blue-400' },
    { emoji: '🥳', caption: 'Celebration Time', color: 'from-yellow-400 to-orange-400' },
    { emoji: '🍰', caption: 'Sweet Treats', color: 'from-purple-400 to-pink-400' },
    { emoji: '🎊', caption: 'Confetti Shower', color: 'from-indigo-400 to-purple-400' },
    { emoji: '🎉', caption: 'Party Highlights', color: 'from-red-400 to-pink-400' },
    { emoji: '🎵', caption: 'Birthday Songs', color: 'from-teal-400 to-blue-400' }
  ];

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'confetti':
        return 'from-pink-400 via-red-500 to-yellow-500';
      case 'balloons':
        return 'from-blue-400 via-purple-500 to-pink-500';
      case 'sparkles':
        return 'from-yellow-400 via-orange-500 to-red-500';
      default:
        return 'from-purple-400 via-pink-500 to-red-500';
    }
  };

  // Stub: Load photos for the card
  const loadPhotos = useCallback(async () => {
    try {
      // TODO: Implement when backend photo handlers are ready
      // const result = await trpc.getPhotosForCard.query({ cardId });
      // setPhotos(result);
      console.log(`Loading photos for card ${cardId} - using placeholder data`);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  }, [cardId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement when backend photo handlers are ready
      // const photoData: AddPhotoInput = {
      //   card_id: cardId,
      //   image_url: newPhotoUrl,
      //   caption: newPhotoCaption || null,
      //   display_order: photos.length
      // };
      // const newPhoto = await trpc.addPhoto.mutate(photoData);
      // setPhotos(prev => [...prev, newPhoto]);
      
      console.log('Photo would be added:', { cardId, newPhotoUrl, newPhotoCaption });
      
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = (photoIndex: number) => {
    // Create sparkle effect
    const photo = document.querySelector(`[data-photo-index="${photoIndex}"]`);
    if (photo) {
      for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.innerHTML = '✨';
        sparkle.className = 'absolute text-2xl pointer-events-none animate-ping z-50';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        photo.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
      }
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-xl">
      <CardHeader className={`bg-gradient-to-r ${getThemeColors(theme)} text-white rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            📸 Birthday Memory Gallery
          </CardTitle>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {placeholderPhotos.length} Photos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Add Photo Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <Input
                  placeholder="Photo URL"
                  value={newPhotoUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhotoUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Photo caption (optional)"
                  value={newPhotoCaption}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhotoCaption(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isLoading ? 'Adding...' : '📸 Add Photo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Add Photo Button */}
        {!showAddForm && (
          <div className="mb-6 text-center">
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
            >
              ➕ Add Memory Photo
            </Button>
          </div>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {placeholderPhotos.map((photo, index) => (
            <div
              key={index}
              data-photo-index={index}
              className="relative group cursor-pointer aspect-square"
              onClick={() => handlePhotoClick(index)}
            >
              <div
                className={`w-full h-full bg-gradient-to-br ${photo.color} rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl overflow-hidden relative`}
              >
                {/* Photo placeholder content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl filter drop-shadow-lg">
                    {photo.emoji}
                  </span>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl"></div>
                
                {/* Caption overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-xl">
                  <p className="text-white text-sm font-medium text-center">
                    {photo.caption}
                  </p>
                </div>
              </div>
              
              {/* Click indicator */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                ✨
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            📝 <strong>Note:</strong> This is a placeholder gallery showing birthday-themed photo memories. 
            Click on any photo to add some sparkle! ✨ 
            {/* TODO: Real photos will be loaded from the database when photo handlers are implemented. */}
          </p>
        </div>

        {/* Empty state for real photos */}
        {photos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📷</div>
            <p>No photos uploaded yet.</p>
            <p className="text-sm mt-2">Add some birthday memories to make this card extra special!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
