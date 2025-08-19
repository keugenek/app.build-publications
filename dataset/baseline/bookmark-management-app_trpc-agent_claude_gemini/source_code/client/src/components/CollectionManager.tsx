import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderIcon, PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, Collection, CreateCollectionInput, UpdateCollectionInput } from '../../../server/src/schema';

interface CollectionManagerProps {
  user: User;
  collections: Collection[];
  onCollectionCreated: () => void;
  onCollectionUpdated: () => void;
  onCollectionDeleted: () => void;
}

export function CollectionManager({
  user,
  collections,
  onCollectionCreated,
  onCollectionUpdated,
  onCollectionDeleted
}: CollectionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateCollectionInput>({
    name: '',
    description: null,
    user_id: user.id
  });

  const [editFormData, setEditFormData] = useState<UpdateCollectionInput>({
    id: 0,
    name: '',
    description: null
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!createFormData.name.trim()) {
      setError('Collection name is required');
      setIsLoading(false);
      return;
    }

    try {
      await trpc.createCollection.mutate(createFormData);
      onCollectionCreated();
      setCreateFormData({ name: '', description: null, user_id: user.id });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      setError('Failed to create collection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!editFormData.name?.trim()) {
      setError('Collection name is required');
      setIsLoading(false);
      return;
    }

    try {
      await trpc.updateCollection.mutate(editFormData);
      onCollectionUpdated();
      setEditingCollection(null);
    } catch (error) {
      console.error('Failed to update collection:', error);
      setError('Failed to update collection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (collection: Collection) => {
    setIsLoading(true);
    try {
      await trpc.deleteCollection.mutate({
        collectionId: collection.id,
        userId: user.id
      });
      onCollectionDeleted();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (collection: Collection) => {
    setEditFormData({
      id: collection.id,
      name: collection.name,
      description: collection.description
    });
    setEditingCollection(collection);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center">
              <FolderIcon className="h-4 w-4 mr-2" />
              Collections
            </CardTitle>
            <CardDescription className="text-sm">
              Organize your bookmarks
            </CardDescription>
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <PlusIcon className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collection</DialogTitle>
                <DialogDescription>
                  Create a new collection to organize your bookmarks.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="collection-name">Name *</Label>
                  <Input
                    id="collection-name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCollectionInput) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    placeholder="Collection name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection-description">Description</Label>
                  <Textarea
                    id="collection-description"
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateCollectionInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="Optional description"
                    disabled={isLoading}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <div className="text-center py-4">
            <FolderIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No collections yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((collection: Collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {collection.name}
                  </div>
                  {collection.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {collection.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(collection)}
                    className="h-6 w-6 p-0"
                  >
                    <EditIcon className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{collection.name}"? Bookmarks in this collection will not be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(collection)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {editingCollection && (
          <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Collection</DialogTitle>
                <DialogDescription>
                  Update your collection details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-collection-name">Name *</Label>
                  <Input
                    id="edit-collection-name"
                    value={editFormData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateCollectionInput) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    placeholder="Collection name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-collection-description">Description</Label>
                  <Textarea
                    id="edit-collection-description"
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: UpdateCollectionInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="Optional description"
                    disabled={isLoading}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCollection(null)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
