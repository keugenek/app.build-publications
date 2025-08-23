import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import type { CreateBookmarkInput } from '../../../server/src/schema';

interface BookmarkFormProps {
  onSubmit: (data: Omit<CreateBookmarkInput, 'user_id'>) => void;
  isLoading: boolean;
}

export function BookmarkForm({ onSubmit, isLoading }: BookmarkFormProps) {
  const [formData, setFormData] = useState<Omit<CreateBookmarkInput, 'user_id'>>({
    url: '',
    title: '',
    description: null,
  });

  const handleSubmit = () => {
    if (formData.url && formData.title) {
      onSubmit(formData);
      setFormData({
        url: '',
        title: '',
        description: null,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Add New Bookmark
        </CardTitle>
        <CardDescription>Save a new bookmark to your collection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
        <Input
          placeholder="URL"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
        />
        <Input
          placeholder="Description (optional)"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            description: e.target.value || null 
          }))}
        />
        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={isLoading || !formData.title || !formData.url}
        >
          {isLoading ? 'Saving...' : 'Save Bookmark'}
        </Button>
      </CardContent>
    </Card>
  );
}
