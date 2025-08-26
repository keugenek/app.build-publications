import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';

interface BookmarkButtonProps {
  recipeId: number;
  userId: string;
  isBookmarked?: boolean;
}

export function BookmarkButton({ recipeId, userId, isBookmarked = false }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBookmark = async () => {
    try {
      if (bookmarked) {
        // In a real implementation, we would remove the bookmark
        console.log('Removing bookmark - not implemented in stub');
      } else {
        // Create bookmark
        await trpc.createBookmark.mutate({
          recipeId,
          userId
        });
      }
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Failed to bookmark recipe:', error);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleBookmark}
      className={`flex items-center gap-1 ${bookmarked ? 'bg-amber-100 hover:bg-amber-200' : ''}`}
    >
      <svg 
        className={`w-4 h-4 ${bookmarked ? 'fill-amber-600 text-amber-600' : ''}`} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}
