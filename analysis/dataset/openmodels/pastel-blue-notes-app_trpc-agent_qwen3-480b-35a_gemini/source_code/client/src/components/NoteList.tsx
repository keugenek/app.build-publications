import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import type { Note, Folder } from '../../../server/src/schema';

interface NoteListProps {
  notes: Note[];
  folders: Folder[];
  onTogglePin: (note: Note) => void;
  onDeleteNote: (id: number) => void;
}

export function NoteList({ notes, folders, onTogglePin, onDeleteNote }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-blue-600">No notes yet. Create your first note!</p>
      </div>
    );
  }

  return (
    <>
      {notes.map(note => (
        <Card 
          key={note.id} 
          className={`bg-white/80 backdrop-blur-sm border-blue-100 ${note.is_pinned ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg text-blue-800">{note.title}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePin(note)}
                  className={`${note.is_pinned ? 'text-blue-600' : 'text-gray-400'} hover:bg-blue-50`}
                >
                  {note.is_pinned ? '★' : '☆'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-red-50 hover:text-red-600">
                      🗑️
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Note</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{note.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-blue-200 text-blue-700 hover:bg-blue-50">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDeleteNote(note.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 mb-4 whitespace-pre-wrap">{note.content}</p>
            <div className="flex justify-between items-center text-sm text-blue-400">
              <span>
                {note.folder_id 
                  ? folders.find(f => f.id === note.folder_id)?.name 
                  : 'No folder'}
              </span>
              <span>
                {new Date(note.updated_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
