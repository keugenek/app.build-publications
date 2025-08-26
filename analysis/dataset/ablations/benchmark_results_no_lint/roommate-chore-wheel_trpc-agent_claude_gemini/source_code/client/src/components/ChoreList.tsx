import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditChoreDialog } from '@/components/EditChoreDialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Chore } from '../../../server/src/schema';

interface ChoreListProps {
  chores: Chore[];
  onChoreUpdated: (chore: Chore) => void;
  onChoreDeleted: (choreId: number) => void;
}

export function ChoreList({ chores, onChoreUpdated, onChoreDeleted }: ChoreListProps) {
  const [deletingChoreId, setDeletingChoreId] = useState<number | null>(null);

  const handleDeleteChore = async (choreId: number) => {
    setDeletingChoreId(choreId);
    try {
      await trpc.deleteChore.mutate({ id: choreId });
      onChoreDeleted(choreId);
    } catch (error) {
      console.error('Failed to delete chore:', error);
    } finally {
      setDeletingChoreId(null);
    }
  };

  if (chores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🧹</div>
        <p className="text-gray-500 text-lg mb-2">No chores defined yet</p>
        <p className="text-gray-400 text-sm">Create your first chore to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {chores.map((chore: Chore) => (
        <Card key={chore.id} className="border-2 border-gray-200 hover:border-indigo-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🧽</span>
              {chore.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chore.description && (
              <p className="text-gray-600 text-sm">{chore.description}</p>
            )}
            <p className="text-xs text-gray-400">
              Created: {chore.created_at.toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <EditChoreDialog
                chore={chore}
                onChoreUpdated={onChoreUpdated}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex-1"
                    disabled={deletingChoreId === chore.id}
                  >
                    {deletingChoreId === chore.id ? 'Deleting...' : '🗑️ Delete'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chore</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{chore.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteChore(chore.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
