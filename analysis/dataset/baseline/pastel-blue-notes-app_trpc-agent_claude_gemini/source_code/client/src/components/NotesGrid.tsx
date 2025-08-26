import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteCard } from './NoteCard';
import { useState, useMemo } from 'react';
import type { Note, Category } from '../../../server/src/schema';

interface NotesGridProps {
  notes: Note[];
  categories: Category[];
  onNoteClick: (note: Note) => void;
  onCreateNote: () => void;
}

export function NotesGrid({ notes, categories, onNoteClick, onCreateNote }: NotesGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    
    const term = searchTerm.toLowerCase();
    return notes.filter((note: Note) => 
      note.title.toLowerCase().includes(term) || 
      note.content.toLowerCase().includes(term)
    );
  }, [notes, searchTerm]);

  const getCategoryById = (categoryId: number | null) => {
    if (!categoryId) return undefined;
    return categories.find((cat: Category) => cat.id === categoryId);
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
              style={{ background: 'rgba(239, 246, 255, 0.3)' }}
            />
          </div>
          <Button 
            onClick={onCreateNote} 
            className="text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium ml-4" 
            style={{ background: 'linear-gradient(90deg, rgb(96 165 250) 0%, rgb(59 130 246) 100%)' }}
          >
            ✏️ New Note
          </Button>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            {searchTerm ? (
              <div>
                <p className="text-blue-600 mb-2">No notes found matching "{searchTerm}"</p>
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium border border-blue-200"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-blue-700">No notes yet</h3>
                <p className="text-blue-600 mb-6">Create your first note to get started!</p>
                <Button 
                  onClick={onCreateNote} 
                  className="text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium" 
                  style={{ background: 'linear-gradient(90deg, rgb(96 165 250) 0%, rgb(59 130 246) 100%)' }}
                >
                  ✏️ Create Your First Note
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map((note: Note) => (
              <NoteCard
                key={note.id}
                note={note}
                category={getCategoryById(note.category_id)}
                onClick={() => onNoteClick(note)}
              />
            ))}
          </div>
        )}

        {filteredNotes.length > 0 && (
          <div className="text-center mt-8 text-blue-500 text-sm">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>
    </div>
  );
}
