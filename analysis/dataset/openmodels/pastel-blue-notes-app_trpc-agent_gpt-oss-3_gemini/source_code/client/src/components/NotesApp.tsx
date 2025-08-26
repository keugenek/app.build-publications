import { useState, useEffect, useCallback, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";
import type { Note, Folder, CreateNoteInput, CreateFolderInput } from "../../../server/src/schema";

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // New note form state
  const [newNote, setNewNote] = useState<CreateNoteInput>({
    content: "",
    folder_id: null,
  });

  // New folder form state
  const [newFolderName, setNewFolderName] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedNotes, fetchedFolders] = await Promise.all([
        trpc.getNotes.query(),
        trpc.getFolders.query(),
      ]);
      setNotes(fetchedNotes);
      setFolders(fetchedFolders);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNote = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await trpc.createNote.mutate(newNote);
      setNotes((prev: Note[]) => [...prev, created]);
      setNewNote({ content: "", folder_id: null });
    } catch (e) {
      console.error("Create note failed", e);
    }
  };

  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const created = await trpc.createFolder.mutate({ name: newFolderName } as CreateFolderInput);
      setFolders((prev: Folder[]) => [...prev, created]);
      setNewFolderName("");
    } catch (e) {
      console.error("Create folder failed", e);
    }
  };

  const handleUpdateNote = async (id: number, content: string, folder_id: number | null) => {
    try {
      const updated = await trpc.updateNote.mutate({ id, content, folder_id });
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updated } : n))
      );
    } catch (e) {
      console.error("Update note failed", e);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-blue-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">My Notes</h1>

      {/* New Folder Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">Folders</h2>
        <form onSubmit={handleCreateFolder} className="flex space-x-2 mb-4">
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Add Folder
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {folders.map((f) => (
            <span
              key={f.id}
              className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm"
            >
              {f.name}
            </span>
          ))}
        </div>
      </section>

      {/* New Note Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">Create Note</h2>
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Textarea
            placeholder="Your note..."
            value={newNote.content}
            onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
            className="h-32"
            required
          />
          <select
            value={newNote.folder_id ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setNewNote((prev) => ({
                ...prev,
                folder_id: val ? Number(val) : null,
              }));
            }}
            className="w-full border border-blue-300 rounded p-2 bg-white"
          >
            <option value="">No Folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Note"}
          </Button>
        </form>
      </section>

      {/* Notes List */}
      <section>
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Your Notes</h2>
        {loading && notes.length === 0 ? (
          <p className="text-blue-600">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-blue-600">No notes yet. Create one above!</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                folders={folders}
                onUpdate={handleUpdateNote}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  folders: Folder[];
  onUpdate: (id: number, content: string, folder_id: number | null) => void;
}

function NoteItem({ note, folders, onUpdate }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [content, setContent] = useState<string>(note.content);
  const [folderId, setFolderId] = useState<number | null>(
    note.folder_id ?? null
  );

  const handleSave = async () => {
    await onUpdate(note.id, content, folderId);
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-24"
          />
          <select
            value={folderId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setFolderId(val ? Number(val) : null);
            }}
            className="w-full border border-blue-300 rounded p-1 bg-white"
          >
            <option value="">No Folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="whitespace-pre-wrap text-blue-900 mb-2">{note.content}</p>
          {note.folder_id && (
            <span className="inline-block px-2 py-1 bg-blue-200 text-blue-900 rounded text-xs">
              {folders.find((f) => f.id === note.folder_id)?.name}
            </span>
          )}
          <div className="mt-2 flex space-x-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
