import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import type { Folder, CreateNoteInput } from '../../../server/src/schema';

interface NoteFormProps {
  userId: number;
  folders: Folder[];
  selectedFolderId: number | null;
  onCreateNote: (noteData: CreateNoteInput) => Promise<void>;
  onCancel?: () => void;
}

export function NoteForm({ userId, folders, selectedFolderId, onCreateNote, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<number | null>(selectedFolderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const noteData: CreateNoteInput = {
      user_id: userId,
      folder_id: folderId,
      title,
      content,
      is_pinned: false
    };
    
    await onCreateNote(noteData);
    
    // Reset form
    setTitle('');
    setContent('');
    setFolderId(selectedFolderId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-blue-200 focus:border-blue-400 focus:ring-blue-300"
      />
      
      <Textarea
        placeholder="Note content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] border-blue-200 focus:border-blue-400 focus:ring-blue-300"
      />
      
      <div className="flex justify-between items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
              {folderId 
                ? folders.find(f => f.id === folderId)?.name 
                : 'Select Folder'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border-blue-200">
            <DropdownMenuItem onClick={() => setFolderId(null)}>
              No Folder
            </DropdownMenuItem>
            {folders.map(folder => (
              <DropdownMenuItem 
                key={folder.id} 
                onClick={() => setFolderId(folder.id)}
              >
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            disabled={!title.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Save Note
          </Button>
        </div>
      </div>
    </form>
  );
}
