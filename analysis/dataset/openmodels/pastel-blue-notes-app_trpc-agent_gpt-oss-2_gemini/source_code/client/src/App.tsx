import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';

// Type‑only imports – keep the client bundle small
import type { Note, Folder, CreateNoteInput, CreateFolderInput } from '@/components/types';

function App() {
  // ----- Data -----
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ----- Forms -----
  const [newFolderName, setNewFolderName] = useState('');
  const [noteForm, setNoteForm] = useState<CreateNoteInput>({
    title: '',
    content: '',
    folder_id: null,
    user_id: 1, // stubbed logged‑in user
  });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // ----- Load data -----
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedFolders, fetchedNotes] = await Promise.all([
        trpc.getFolders.query(),
        trpc.getNotes.query(),
      ]);
      setFolders(fetchedFolders);
      setNotes(fetchedNotes);
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----- Folder handling -----
  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const folder: Folder = await trpc.createFolder.mutate({
        name: newFolderName.trim(),
        user_id: 1, // stubbed user
      } as CreateFolderInput);
      setFolders((prev: Folder[]) => [...prev, folder]);
      setNewFolderName('');
    } catch (e) {
      console.error('Create folder error', e);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    // Delete all notes inside the folder first (simple cascade stub)
    const notesInFolder = notes.filter((n) => n.folder_id === folderId);
    await Promise.all(notesInFolder.map((n) => trpc.deleteNote.mutate({ id: n.id })));
    await trpc.deleteFolder.mutate({ id: folderId });
    setFolders((prev: Folder[]) => prev.filter((f) => f.id !== folderId));
    setNotes((prev: Note[]) => prev.filter((n) => n.folder_id !== folderId));
  };

  // ----- Note handling -----
  const resetNoteForm = () => {
    setNoteForm({ title: '', content: '', folder_id: null, user_id: 1 });
    setEditingNoteId(null);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...noteForm };
    try {
      if (editingNoteId) {
        // Update existing note
        const updated: Note = await trpc.updateNote.mutate({
          id: editingNoteId,
          title: noteForm.title,
          content: noteForm.content,
          folder_id: noteForm.folder_id,
        });
        setNotes((prev: Note[]) => prev.map((n) => (n.id === editingNoteId ? updated : n)));
      } else {
        // Create new note
        const created: Note = await trpc.createNote.mutate(payload);
        setNotes((prev: Note[]) => [...prev, created]);
      }
      resetNoteForm();
    } catch (e) {
      console.error('Note submit error', e);
    }
  };

  const startEditNote = (note: Note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      folder_id: note.folder_id,
      user_id: note.user_id,
    });
    setEditingNoteId(note.id);
  };

  const handleDeleteNote = async (noteId: number) => {
    await trpc.deleteNote.mutate({ id: noteId });
    setNotes((prev: Note[]) => prev.filter((n) => n.id !== noteId));
    if (editingNoteId === noteId) resetNoteForm();
  };

  // ----- Render helpers -----
  const notesByFolder = (folderId: number | null) =>
    notes.filter((n) => n.folder_id === folderId);

  return (
    <div className="min-h-screen bg-blue-50 p-4 text-gray-800 font-sans">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-blue-800">🗒️ Minimalist Notes</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ----- Folder sidebar ----- */}
        <aside className="lg:col-span-1 space-y-4">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-700">Folders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-blue-100"
                >
                  <span>{folder.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-red-500"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <form onSubmit={handleCreateFolder} className="flex w-full space-x-2">
                <Input
                  placeholder="New folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button type="submit" disabled={isLoading}>Add</Button>
              </form>
            </CardFooter>
          </Card>
        </aside>

        {/* ----- Main area ----- */}
        <main className="lg:col-span-3 space-y-6">
          {/* Note creation / edit form */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-700">
                {editingNoteId ? 'Edit Note' : 'Create New Note'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNoteSubmit} className="space-y-4">
                <Input
                  placeholder="Title"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Content"
                  required
                  rows={5}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, content: e.target.value }))}
                />
                <Select
                  value={noteForm.folder_id?.toString() ?? ''}
                  onValueChange={(val) => {
                    const fid = val ? Number(val) : null;
                    setNoteForm((prev) => ({ ...prev, folder_id: fid }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Folder (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingNoteId ? 'Update' : 'Create'}
                  </Button>
                  {editingNoteId && (
                    <Button type="button" variant="outline" onClick={resetNoteForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notes list */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">All Notes</h2>
            {folders.map((folder) => (
              <div key={folder.id} className="mb-6">
                <h3 className="text-xl font-medium text-blue-700 mb-2">📁 {folder.name}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {notesByFolder(folder.id).map((note) => (
                    <Card key={note.id} className="bg-white shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 line-clamp-3">{note.content}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => startEditNote(note)}>
                          ✏️ Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                          🗑️ Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            {/* Notes without a folder */}
            <div>
              <h3 className="text-xl font-medium text-blue-700 mb-2">📂 Unfoldered</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {notesByFolder(null).map((note) => (
                  <Card key={note.id} className="bg-white shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 line-clamp-3">{note.content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditNote(note)}>
                        ✏️ Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                        🗑️ Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
