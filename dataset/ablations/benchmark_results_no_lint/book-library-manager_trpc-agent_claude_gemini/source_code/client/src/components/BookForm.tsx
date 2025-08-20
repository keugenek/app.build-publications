import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Book, CreateBookInput, UpdateBookInput, ReadingStatus } from '../../../server/src/schema';

interface BookFormProps {
  onSubmit: (data: CreateBookInput | UpdateBookInput) => Promise<void>;
  genres: string[];
  onCancel: () => void;
  initialData?: Book;
  isEditing?: boolean;
}

const READING_STATUS_OPTIONS: ReadingStatus[] = ['To Read', 'Reading', 'Finished'];

export function BookForm({ onSubmit, genres, onCancel, initialData, isEditing = false }: BookFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    author: initialData?.author || '',
    genre: initialData?.genre || '',
    reading_status: initialData?.reading_status || 'To Read' as ReadingStatus
  });
  const [isLoading, setIsLoading] = useState(false);
  const [customGenre, setCustomGenre] = useState('');
  const [showCustomGenre, setShowCustomGenre] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalGenre = showCustomGenre && customGenre.trim() ? customGenre.trim() : formData.genre;
      
      const submitData = {
        ...formData,
        genre: finalGenre
      };

      if (isEditing && initialData) {
        await onSubmit({
          id: initialData.id,
          ...submitData
        });
      } else {
        await onSubmit(submitData as CreateBookInput);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomGenre(true);
      setFormData((prev) => ({ ...prev, genre: '' }));
    } else {
      setShowCustomGenre(false);
      setCustomGenre('');
      setFormData((prev) => ({ ...prev, genre: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter book title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author *</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, author: e.target.value }))
          }
          placeholder="Enter author name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Genre *</Label>
        <Select
          value={showCustomGenre ? 'custom' : formData.genre}
          onValueChange={handleGenreChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select or add genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre: string) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
            <SelectItem value="custom">+ Add custom genre</SelectItem>
          </SelectContent>
        </Select>
        
        {showCustomGenre && (
          <Input
            value={customGenre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomGenre(e.target.value)}
            placeholder="Enter custom genre"
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reading-status">Reading Status</Label>
        <Select
          value={formData.reading_status}
          onValueChange={(value: ReadingStatus) =>
            setFormData((prev) => ({ ...prev, reading_status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {READING_STATUS_OPTIONS.map((status: ReadingStatus) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Book' : 'Add Book')}
        </Button>
      </div>
    </form>
  );
}
