import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderIcon, PlusIcon, CalendarIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Collection, CreateCollectionInput } from '../../../server/src/schema';

interface CollectionManagerProps {
  userId: number;
  collections: Collection[];
  onCollectionCreated: (collection: Collection) => void;
}

export function CollectionManager({ userId, collections, onCollectionCreated }: CollectionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCollectionInput>({
    name: '',
    description: null,
    user_id: userId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newCollection = await trpc.createCollection.mutate(formData);
      
      // Since the backend is a stub, we'll create a mock collection response
      const collectionWithData: Collection = {
        id: newCollection.id || Date.now(), // Fallback for stub
        name: formData.name,
        description: formData.description,
        user_id: formData.user_id,
        created_at: new Date()
      };

      onCollectionCreated(collectionWithData);

      // Reset form
      setFormData({
        name: '',
        description: null,
        user_id: userId
      });
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Create New Collection
          </CardTitle>
          <CardDescription>
            Group related bookmarks together for better organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Collection Name */}
            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection Name *</Label>
              <Input
                id="collection-name"
                placeholder="e.g., Web Development, Recipes, Travel Plans"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Collection Description */}
            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                placeholder="Optional description for this collection"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Creating Collection...' : 'Create Collection'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Collections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5" />
            Your Collections ({collections.length})
          </CardTitle>
          {collections.length === 0 && (
            <CardDescription>
              No collections yet. Create your first collection above!
            </CardDescription>
          )}
        </CardHeader>
        {collections.length > 0 && (
          <CardContent>
            <div className="grid gap-4">
              {collections.map(collection => (
                <Card key={collection.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FolderIcon className="w-5 h-5 text-blue-500" />
                          {collection.name}
                        </CardTitle>
                        {collection.description && (
                          <CardDescription className="mt-1">
                            {collection.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarIcon className="w-3 h-3" />
                        {collection.created_at.toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Collections Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Tips for Collections</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use collections to group bookmarks by project, topic, or purpose</li>
                <li>• Collections are optional - you can have unorganized bookmarks too</li>
                <li>• Each bookmark can belong to only one collection</li>
                <li>• Use tags for cross-cutting categories that span multiple collections</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
