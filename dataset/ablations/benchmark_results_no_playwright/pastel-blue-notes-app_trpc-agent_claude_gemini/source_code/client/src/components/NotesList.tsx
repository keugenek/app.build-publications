// Simple date formatting helper
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Note, Folder } from '../../../server/src/schema';

interface NotesListProps {
  notes: Note[];
  selectedFolder: Folder | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
  isLoading: boolean;
}

export function NotesList({ notes, selectedFolder, onSelectNote, onDeleteNote, isLoading }: NotesListProps) {
  const getFolderName = (folderId: number | null) => {
    if (folderId === null) return 'All Notes';
    return selectedFolder?.name || 'Folder';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-blue-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-blue-200/50 p-6">
        <h2 className="text-2xl font-semibold text-blue-900">
          {getFolderName(selectedFolder?.id || null)}
        </h2>
        <p className="text-sm text-blue-600 mt-1">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-blue-300 mb-4" />
            <h3 className="text-lg font-medium text-blue-700 mb-2">No notes yet</h3>
            <p className="text-blue-500 text-sm">
              {selectedFolder 
                ? `Create your first note in "${selectedFolder.name}"`
                : 'Create your first note to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note: Note) => (
              <div
                key={note.id}
                className="note-item pastel-card group relative"
                onClick={() => onSelectNote(note)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-blue-900 text-sm line-clamp-2 flex-1">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-red-100 ml-2"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                  <p className="text-blue-600 text-xs line-clamp-3 mb-3">
                    {note.content || 'No content'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-blue-500">
                    <span>
                      {formatDistanceToNow(note.updated_at)}
                    </span>
                    <FileText className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
