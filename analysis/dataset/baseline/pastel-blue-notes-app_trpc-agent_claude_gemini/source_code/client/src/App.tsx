import { useState, useEffect, useCallback } from 'react';
import { AuthForm } from './components/AuthForm';
import { CategorySidebar } from './components/CategorySidebar';
import { NotesGrid } from './components/NotesGrid';
import { NoteEditor } from './components/NoteEditor';
import { trpc } from './utils/trpc';
import type { AuthResponse, Note, Category } from '../../server/src/schema';
import './App.css';

function App() {
  // Authentication state
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App state
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load user data from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('notesAppUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('notesAppUser');
      }
    }
  }, []);

  // Load notes and categories when user is authenticated
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load categories
      const categoriesResult = await trpc.getCategories.query({ userId: user.id });
      setCategories(categoriesResult);

      // Load notes (filtered by category if selected)
      const notesResult = await trpc.getNotes.query({ 
        userId: user.id, 
        categoryId: selectedCategoryId || undefined
      });
      setNotes(notesResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedCategoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAuthSuccess = (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setIsAuthenticated(true);
    // Save user data to localStorage for persistence
    localStorage.setItem('notesAppUser', JSON.stringify(authResponse.user));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setNotes([]);
    setCategories([]);
    setSelectedCategoryId(null);
    setSelectedNote(null);
    setIsEditorOpen(false);
    localStorage.removeItem('notesAppUser');
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsEditorOpen(true);
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsEditorOpen(true);
  };

  const handleNoteSaved = (note: Note) => {
    if (selectedNote) {
      // Update existing note in the list
      setNotes((prev: Note[]) => 
        prev.map((n: Note) => n.id === note.id ? note : n)
      );
    } else {
      // Add new note to the list
      setNotes((prev: Note[]) => [note, ...prev]);
    }
    setSelectedNote(null);
  };

  const handleNoteDeleted = (noteId: number) => {
    setNotes((prev: Note[]) => prev.filter((note: Note) => note.id !== noteId));
    setSelectedNote(null);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    setIsEditorOpen(false);
  };

  // Show authentication form if not logged in
  if (!isAuthenticated || !user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <CategorySidebar
        userId={user.id}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onLogout={handleLogout}
        userEmail={user.email}
      />

      {/* Main content */}
      <div 
        className="flex-1 min-h-screen"
        style={{ background: 'linear-gradient(135deg, rgb(248 250 252) 0%, rgba(224, 242, 254, 0.3) 100%)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-blue-600">Loading your notes...</p>
            </div>
          </div>
        ) : (
          <NotesGrid
            notes={notes}
            categories={categories}
            onNoteClick={handleNoteClick}
            onCreateNote={handleCreateNote}
          />
        )}
      </div>

      {/* Note Editor Dialog */}
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        note={selectedNote}
        categories={categories}
        userId={user.id}
        onNoteSaved={handleNoteSaved}
        onNoteDeleted={handleNoteDeleted}
      />
    </div>
  );
}

export default App;
