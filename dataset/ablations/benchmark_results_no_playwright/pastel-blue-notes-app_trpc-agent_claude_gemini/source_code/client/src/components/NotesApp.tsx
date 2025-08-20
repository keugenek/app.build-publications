import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, FolderPlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { Sidebar } from '@/components/Sidebar';
import { NoteEditor } from '@/components/NoteEditor';
import { NotesList } from '@/components/NotesList';
import type { User, Note, Folder } from '../../../server/src/schema';

interface NotesAppProps {
  user: User;
  onLogout: () => void;
}

export function NotesApp({ user, onLogout }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'list' | 'editor'>('list');

  // Load user's folders and notes
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userFolders, userNotes] = await Promise.all([
        trpc.getUserFolders.query({ user_id: user.id }),
        trpc.getUserNotes.query({ user_id: user.id })
      ]);
      setFolders(userFolders);
      setNotes(userNotes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter notes based on selected folder and search query
  const filteredNotes = notes.filter((note: Note) => {
    const matchesFolder = selectedFolder 
      ? note.folder_id === selectedFolder.id 
      : note.folder_id === null;
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleCreateNote = async () => {
    try {
      const newNote = await trpc.createNote.mutate({
        user_id: user.id,
        folder_id: selectedFolder?.id || null,
        title: 'Untitled Note',
        content: ''
      });
      setNotes((prev: Note[]) => [...prev, newNote]);
      setSelectedNote(newNote);
      setView('editor');
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      try {
        const newFolder = await trpc.createFolder.mutate({
          user_id: user.id,
          name: name.trim()
        });
        setFolders((prev: Folder[]) => [...prev, newFolder]);
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setView('editor');
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      await trpc.updateNote.mutate({
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        folder_id: updatedNote.folder_id
      });
      setNotes((prev: Note[]) => 
        prev.map((note: Note) => 
          note.id === updatedNote.id ? updatedNote : note
        )
      );
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await trpc.deleteNote.mutate({
        id: noteId,
        user_id: user.id
      });
      setNotes((prev: Note[]) => prev.filter((note: Note) => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setView('list');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (confirm('Delete folder and all its notes?')) {
      try {
        await trpc.deleteFolder.mutate({
          id: folderId,
          user_id: user.id
        });
        setFolders((prev: Folder[]) => prev.filter((folder: Folder) => folder.id !== folderId));
        if (selectedFolder?.id === folderId) {
          setSelectedFolder(null);
        }
        // Refresh notes as folder deletion might affect them
        loadData();
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 pastel-sidebar flex flex-col">
        <div className="p-4 border-b border-blue-200/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-blue-900">📝 Notes</h1>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-blue-600 mb-3">
            Welcome, {user.email}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 pastel-input"
            />
          </div>
        </div>

        <Sidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        <div className="p-4 border-t border-blue-200/50 space-y-2">
          <Button
            onClick={handleCreateNote}
            className="w-full justify-start pastel-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="outline"
            className="w-full justify-start border-blue-200 hover:bg-blue-50"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {view === 'editor' && selectedNote ? (
          <NoteEditor
            note={selectedNote}
            folders={folders}
            onUpdate={handleUpdateNote}
            onClose={() => {
              setView('list');
              setSelectedNote(null);
            }}
          />
        ) : (
          <NotesList
            notes={filteredNotes}
            selectedFolder={selectedFolder}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
