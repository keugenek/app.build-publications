import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateBookInput, ReadingStatus, Book } from '../../../server/src/schema';

interface BookFormProps {
  onSubmit: (data: CreateBookInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Book;
  genres: string[];
}

export function BookForm({ onSubmit, isLoading = false, initialData, genres }: BookFormProps) {
  const [formData, setFormData] = useState<CreateBookInput>({
    title: '',
    author: '',
    genre: '',
    reading_status: 'Want to Read'
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author,
        genre: initialData.genre,
        reading_status: initialData.reading_status
      });
    } else {
      setFormData({
        title: '',
        author: '',
        genre: '',
        reading_status: 'Want to Read'
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.genre.trim()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form only if not in edit mode (initialData not provided)
      if (!initialData) {
        setFormData({
          title: '',
          author: '',
          genre: '',
          reading_status: 'Want to Read'
        });
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const readingStatusOptions: { value: ReadingStatus; label: string; emoji: string }[] = [
    { value: 'Want to Read', label: 'Want to Read', emoji: '🔖' },
    { value: 'Currently Reading', label: 'Currently Reading', emoji: '📖' },
    { value: 'Read', label: 'Read', emoji: '✅' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter book title..."
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookInput) => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          placeholder="Enter author name..."
          value={formData.author}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookInput) => ({ ...prev, author: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Genre</Label>
        <div className="flex gap-2">
          <Input
            id="genre"
            placeholder="Enter or select genre..."
            value={formData.genre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateBookInput) => ({ ...prev, genre: e.target.value }))
            }
            required
            className="flex-1"
            list="genres"
          />
          {/* Datalist for genre suggestions */}
          <datalist id="genres">
            {genres.map((genre: string) => (
              <option key={genre} value={genre} />
            ))}
          </datalist>
        </div>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 5).map((genre: string) => (
              <Button
                key={genre}
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setFormData((prev: CreateBookInput) => ({ ...prev, genre }))}
              >
                {genre}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reading_status">Reading Status</Label>
        <Select 
          value={formData.reading_status || 'Want to Read'} 
          onValueChange={(value: ReadingStatus) => 
            setFormData((prev: CreateBookInput) => ({ ...prev, reading_status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select reading status" />
          </SelectTrigger>
          <SelectContent>
            {readingStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {initialData ? 'Updating...' : 'Adding...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>{initialData ? '💾' : '➕'}</span>
            {initialData ? 'Update Book' : 'Add Book'}
          </span>
        )}
      </Button>
    </form>
  );
}
