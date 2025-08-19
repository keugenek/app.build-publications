import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Note, Category, CreateNoteInput, UpdateNoteInput } from '../../../server/src/schema';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  categories: Category[];
  userId: number;
  onNoteSaved: (note: Note) => void;
  onNoteDeleted: (noteId: number) => void;
}

export function NoteEditor({ 
  isOpen, 
  onClose, 
  note, 
  categories, 
  userId, 
  onNoteSaved,
  onNoteDeleted 
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategoryId(note.category_id?.toString() || 'none');
    } else {
      setTitle('');
      setContent('');
      setCategoryId('none');
    }
    setError(null);
  }, [note, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Note title is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (note) {
        // Update existing note
        const updateData: UpdateNoteInput = {
          id: note.id,
          title,
          content,
          category_id: categoryId !== 'none' ? parseInt(categoryId) : null,
          user_id: userId
        };
        const updatedNote = await trpc.updateNote.mutate(updateData);
        onNoteSaved(updatedNote);
      } else {
        // Create new note
        const createData: CreateNoteInput = {
          title,
          content,
          category_id: categoryId !== 'none' ? parseInt(categoryId) : null,
          user_id: userId
        };
        const newNote = await trpc.createNote.mutate(createData);
        onNoteSaved(newNote);
      }
      onClose();
    } catch (err) {
      setError('Failed to save note. Please try again.');
      console.error('Save note error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteNote.mutate({ noteId: note.id, userId });
      onNoteDeleted(note.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (err) {
      setError('Failed to delete note. Please try again.');
      console.error('Delete note error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-blue-800">
              {note ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <Input
                placeholder="Note title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 text-base font-medium"
                style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                required
              />
            </div>
            
            <div>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger 
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                  style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                >
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#dbeafe' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-h-0">
              <Textarea
                placeholder="Start writing your note..."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 resize-none h-full min-h-[200px] text-sm leading-relaxed"
                style={{ background: 'rgba(239, 246, 255, 0.3)' }}
              />
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div>
                {note && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium border border-blue-200"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium" 
                  style={{ background: 'linear-gradient(90deg, rgb(96 165 250) 0%, rgb(59 130 246) 100%)' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Note'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-800">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">
              Are you sure you want to delete "{note?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium border border-blue-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
