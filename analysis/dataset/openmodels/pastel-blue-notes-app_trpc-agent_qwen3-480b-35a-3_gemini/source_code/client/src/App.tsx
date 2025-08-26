import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, Folder, Note, CreateFolderInput, CreateNoteInput, UpdateNoteInput } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user session
  const loadUserSession = useCallback(async () => {
    try {
      // In a real app, we'd get user from session/cookie
      // For this implementation, we'll create a user if none exists
      if (!user) {
        const newUser = await trpc.createUser.mutate({
          email: 'user@example.com',
          name: 'Default User'
        });
        setUser(newUser);
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
    }
  }, [user]);

  // Load folders for user
  const loadFolders = useCallback(async () => {
    if (!user) return;
    try {
      const result = await trpc.getUserFolders.query({ userId: user.id });
      setFolders(result);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [user]);

  // Load notes for current folder or user
  const loadNotes = useCallback(async () => {
    if (!user) return;
    try {
      let result: Note[] = [];
      if (currentFolder) {
        result = await trpc.getFolderNotes.query({ folderId: currentFolder.id });
      } else {
        result = await trpc.getUserNotes.query({ userId: user.id });
      }
      setNotes(result);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [user, currentFolder]);

  useEffect(() => {
    loadUserSession();
  }, [loadUserSession]);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadNotes();
    }
  }, [user, currentFolder, loadFolders, loadNotes]);

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    
    setIsLoading(true);
    try {
      const folderData: CreateFolderInput = {
        name: newFolderName.trim(),
        user_id: user.id
      };
      
      const newFolder = await trpc.createFolder.mutate(folderData);
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim()) return;
    
    setIsLoading(true);
    try {
      const noteData: CreateNoteInput = {
        title: newNote.title.trim(),
        content: newNote.content,
        user_id: user.id,
        folder_id: currentFolder?.id || null
      };
      
      const createdNote = await trpc.createNote.mutate(noteData);
      setNotes(prev => [...prev, createdNote]);
      setNewNote({ title: '', content: '' });
      setIsCreatingNote(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateNoteInput = {
        id: editingNote.id,
        title: editingNote.title,
        content: editingNote.content,
        folder_id: editingNote.folder_id
      };
      
      const updatedNote = await trpc.updateNote.mutate(updateData);
      setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFolder = (folder: Folder | null) => {
    setCurrentFolder(folder);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Notes</h1>
          <div className="flex items-center mt-2">
            <span className="text-blue-600 mr-4">Welcome{user?.name ? `, ${user.name}` : ''}!</span>
            {user && (
              <span className="text-sm text-blue-500 bg-blue-100 px-2 py-1 rounded">
                {user.email}
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Folders sidebar */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-700">Folders</h2>
              <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    + New
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-blue-50 border-blue-200">
                  <DialogHeader>
                    <DialogTitle className="text-blue-800">Create Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewFolderName(e.target.value)
                      }
                      className="border-blue-200"
                    />
                    <Button 
                      onClick={handleCreateFolder}
                      disabled={isLoading || !newFolderName.trim()}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isLoading ? 'Creating...' : 'Create Folder'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-2">
              <Button
                variant={currentFolder === null ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  currentFolder === null 
                    ? "bg-blue-200 text-blue-800 hover:bg-blue-200" 
                    : "text-blue-600 hover:bg-blue-100"
                }`}
                onClick={() => selectFolder(null)}
              >
                All Notes
              </Button>
              
              {folders.map((folder: Folder) => (
                <Button
                  key={folder.id}
                  variant={currentFolder?.id === folder.id ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    currentFolder?.id === folder.id 
                      ? "bg-blue-200 text-blue-800 hover:bg-blue-200" 
                      : "text-blue-600 hover:bg-blue-100"
                  }`}
                  onClick={() => selectFolder(folder)}
                >
                  {folder.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes list */}
          <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-700">
                {currentFolder ? currentFolder.name : 'All Notes'}
              </h2>
              
              <Dialog open={isCreatingNote} onOpenChange={setIsCreatingNote}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    + New Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-blue-50 border-blue-200 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-blue-800">Create Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Note title"
                      value={newNote.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewNote(prev => ({ ...prev, title: e.target.value }))
                      }
                      className="border-blue-200"
                    />
                    <Textarea
                      placeholder="Note content"
                      value={newNote.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        setNewNote(prev => ({ ...prev, content: e.target.value }))
                      }
                      className="min-h-[200px] border-blue-200"
                    />
                    <Button 
                      onClick={handleCreateNote}
                      disabled={isLoading || !newNote.title.trim()}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isLoading ? 'Creating...' : 'Create Note'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {notes.length === 0 ? (
              <div className="text-center py-12 text-blue-400">
                <p>No notes yet. Create your first note!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note: Note) => (
                  <div 
                    key={note.id} 
                    className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setEditingNote(note)}
                  >
                    <h3 className="font-semibold text-blue-800 truncate">{note.title}</h3>
                    <p className="text-blue-600 text-sm mt-2 line-clamp-3">
                      {note.content || 'No content'}
                    </p>
                    <div className="flex justify-between items-center mt-4 text-xs text-blue-400">
                      <span>
                        {note.updated_at.toLocaleDateString()}
                      </span>
                      <span>
                        {note.updated_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Note editing dialog */}
        <Dialog 
          open={!!editingNote} 
          onOpenChange={(open) => !open && setEditingNote(null)}
        >
          <DialogContent className="bg-blue-50 border-blue-200 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-blue-800">Edit Note</DialogTitle>
            </DialogHeader>
            {editingNote && (
              <div className="space-y-4">
                <Input
                  value={editingNote.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)
                  }
                  className="border-blue-200"
                />
                <Textarea
                  value={editingNote.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)
                  }
                  className="min-h-[300px] border-blue-200"
                />
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setEditingNote(null)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-100"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateNote}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isLoading ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
