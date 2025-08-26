import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateBookInput, UpdateBookInput, Book, ReadingStatus } from '../../../server/src/schema';

interface BookFormProps {
  initialData?: Book;
  onSubmit: (data: CreateBookInput) => Promise<void>;
  onUpdate?: (data: UpdateBookInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function BookForm({ 
  initialData, 
  onSubmit,
  onUpdate, 
  isLoading = false, 
  submitLabel = "Save Book" 
}: BookFormProps) {
  const [formData, setFormData] = useState<CreateBookInput>({
    title: '',
    author: '',
    genre: '',
    reading_status: 'To Read'
  });

  // Populate form with initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author,
        genre: initialData.genre,
        reading_status: initialData.reading_status
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (initialData && onUpdate) {
      // For updates, include the ID
      const updateData: UpdateBookInput = {
        id: initialData.id,
        ...formData
      };
      await onUpdate(updateData);
    } else {
      // For creation, just use the form data
      await onSubmit(formData);
    }
    
    // Reset form only for creation (not editing)
    if (!initialData) {
      setFormData({
        title: '',
        author: '',
        genre: '',
        reading_status: 'To Read'
      });
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev: CreateBookInput) => ({
      ...prev,
      reading_status: value as ReadingStatus
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookInput) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter book title"
          required
          className="focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author *</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookInput) => ({ ...prev, author: e.target.value }))
          }
          placeholder="Enter author name"
          required
          className="focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Genre *</Label>
        <Input
          id="genre"
          value={formData.genre}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateBookInput) => ({ ...prev, genre: e.target.value }))
          }
          placeholder="e.g., Fiction, Science Fiction, Biography"
          required
          className="focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reading_status">Reading Status *</Label>
        <Select 
          value={formData.reading_status} 
          onValueChange={handleStatusChange}
          required
        >
          <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
            <SelectValue placeholder="Select reading status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="To Read">📚 To Read</SelectItem>
            <SelectItem value="Reading">📖 Currently Reading</SelectItem>
            <SelectItem value="Finished">✅ Finished</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isLoading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
