import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoteForm } from '@/components/NoteForm';
import { FolderForm } from '@/components/FolderForm';
import { NoteList } from '@/components/NoteList';
import { trpc } from '@/utils/trpc';
import type { Note, Folder, CreateUserInput, UpdateNoteInput } from '../../server/src/schema';

function App() {
  // User state
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  // Notes and folders state
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Load folders
  const loadFolders = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await trpc.getUserFolders.query({ userId });
      setFolders(result);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [userId]);
  
  // Load notes
  const loadNotes = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await trpc.getUserNotes.query({ userId });
      setNotes(result);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [userId]);
  
  // Load user data from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserEmail = localStorage.getItem('userEmail');
    const storedUserName = localStorage.getItem('userName');
    
    if (storedUserId && storedUserEmail) {
      setUserId(parseInt(storedUserId));
      setUserEmail(storedUserEmail);
      setUserName(storedUserName || '');
    }
  }, []);
  
  // Load folders and notes when user is set
  useEffect(() => {
    if (userId) {
      loadFolders();
      loadNotes();
    }
  }, [userId, loadFolders, loadNotes]);
  
  // Create user
  const handleCreateUser = async () => {
    if (!userEmail) return;
    
    setIsCreatingUser(true);
    try {
      const userData: CreateUserInput = {
        email: userEmail,
        name: userName || null
      };
      
      const user = await trpc.createUser.mutate(userData);
      setUserId(user.id);
      
      // Save to localStorage
      localStorage.setItem('userId', user.id.toString());
      localStorage.setItem('userEmail', user.email);
      if (user.name) {
        localStorage.setItem('userName', user.name);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };
  
  
  
  // Update note
  const handleUpdateNote = async (id: number, updates: Partial<UpdateNoteInput>) => {
    try {
      const updateData: UpdateNoteInput = {
        id,
        ...updates
      } as UpdateNoteInput;
      
      const updatedNote = await trpc.updateNote.mutate(updateData);
      
      setNotes(prev => 
        prev.map(note => 
          note.id === id ? { ...note, ...updatedNote } : note
        )
      );
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };
  
  // Delete note
  const handleDeleteNote = async (id: number) => {
    try {
      await trpc.deleteNote.mutate({ noteId: id });
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };
  
  // Toggle pin status
  const togglePinNote = async (note: Note) => {
    await handleUpdateNote(note.id, { is_pinned: !note.is_pinned });
  };
  
  // Filter notes by selected folder
  const filteredNotes = selectedFolderId 
    ? notes.filter(note => note.folder_id === selectedFolderId)
    : notes;
    
  // Pinned notes first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return b.updated_at.getTime() - a.updated_at.getTime();
  });

  // If no user, show login/signup form
  if (!userId) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">Welcome to Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-600">Sign in to access your notes across devices</p>
            
            <Input
              type="email"
              placeholder="Your email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-300"
            />
            
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-300"
            />
            
            <Button 
              onClick={handleCreateUser}
              disabled={isCreatingUser || !userEmail}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isCreatingUser ? 'Creating Account...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main app interface
  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 py-4">
          <h1 className="text-3xl font-bold text-blue-800">Notes</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-blue-600">Welcome, {userName || userEmail}</span>
            <Button 
              variant="outline" 
              onClick={() => {
                // Clear user data
                setUserId(null);
                setUserEmail('');
                setUserName('');
                setNotes([]);
                setFolders([]);
                localStorage.removeItem('userId');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
              }}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Sign Out
            </Button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-800">Folders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <Button
                    variant={selectedFolderId === null ? "default" : "outline"}
                    onClick={() => setSelectedFolderId(null)}
                    className={`w-full justify-start ${selectedFolderId === null ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
                  >
                    All Notes
                  </Button>
                  
                  {folders.map(folder => (
                    <div key={folder.id} className="flex items-center">
                      <Button
                        variant={selectedFolderId === folder.id ? "default" : "outline"}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`w-full justify-start ${selectedFolderId === folder.id ? 'bg-blue-500 text-white hover:bg-blue-600' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
                      >
                        {folder.name}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <FolderForm 
                  userId={userId} 
                  onCreateFolder={async (folderData) => {
                    try {
                      const folder = await trpc.createFolder.mutate(folderData);
                      setFolders(prev => [...prev, folder]);
                    } catch (error) {
                      console.error('Failed to create folder:', error);
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Note Form */}
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-800">Create New Note</CardTitle>
              </CardHeader>
              <CardContent>
                <NoteForm
                  userId={userId}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onCreateNote={async (noteData) => {
                    try {
                      const note = await trpc.createNote.mutate(noteData);
                      setNotes(prev => [note, ...prev]);
                    } catch (error) {
                      console.error('Failed to create note:', error);
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            {/* Notes List */}
            <NoteList 
              notes={sortedNotes} 
              folders={folders} 
              onTogglePin={togglePinNote} 
              onDeleteNote={handleDeleteNote} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
