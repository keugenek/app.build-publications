import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Collection, CreateCollectionInput } from '../../../server/src/schema';

interface CollectionManagerProps {
  userId: number;
  collections: Collection[];
  onCollectionCreated: (collection: Collection) => void;
  onCollectionDeleted: (collectionId: number) => void;
}

export function CollectionManager({
  userId,
  collections,
  onCollectionCreated,
  onCollectionDeleted
}: CollectionManagerProps) {
  const [formData, setFormData] = useState<CreateCollectionInput>({
    user_id: userId,
    name: '',
    description: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const collectionData = {
        ...formData,
        description: formData.description || null
      };

      const newCollection = await trpc.createCollection.mutate(collectionData);
      onCollectionCreated(newCollection);
      
      // Reset form
      setFormData({
        user_id: userId,
        name: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create collection:', error);
      setError('Failed to create collection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (collectionId: number) => {
    setDeletingId(collectionId);
    try {
      await trpc.deleteCollection.mutate({ collectionId, userId });
      onCollectionDeleted(collectionId);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      setError('Failed to delete collection. It may contain bookmarks.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Collection</CardTitle>
          <CardDescription>
            Organize your bookmarks into collections for better management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection Name *</Label>
              <Input
                id="collection-name"
                type="text"
                placeholder="e.g., Tech Resources, Reading List"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCollectionInput) => ({ ...prev, name: e.target.value }))
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                placeholder="Optional description for this collection..."
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateCollectionInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                disabled={isLoading}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : '📁 Create Collection'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Existing Collections */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Your Collections ({collections.length})
        </h3>
        
        {collections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl mb-3">📁</div>
              <h4 className="font-semibold mb-2">No collections yet</h4>
              <p className="text-gray-500 text-center text-sm">
                Create your first collection to organize your bookmarks
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection: Collection) => (
              <Card key={collection.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        📁 {collection.name}
                      </CardTitle>
                      {collection.description && (
                        <CardDescription className="mt-1">
                          {collection.description}
                        </CardDescription>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === collection.id}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          🗑️
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{collection.name}"? 
                            This will remove the collection but bookmarks will remain.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(collection.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-500">
                    Created {collection.created_at.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
