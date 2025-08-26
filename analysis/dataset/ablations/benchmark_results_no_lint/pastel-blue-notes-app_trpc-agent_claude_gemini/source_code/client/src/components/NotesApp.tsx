import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User, Note, Category, CreateNoteInput, CreateCategoryInput } from '../../../server/src/schema';

interface NotesAppProps {
  user: User;
  onLogout: () => void;
}

export function NotesApp({ user, onLogout }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  // Form states
  const [noteForm, setNoteForm] = useState<CreateNoteInput>({
    title: '',
    content: '',
    user_id: user.id,
    category_id: null
  });
  
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    user_id: user.id
  });

  // Load data
  const loadNotes = useCallback(async () => {
    try {
      const queryInput: { user_id: number; category_id?: number } = { user_id: user.id };
      
      if (selectedCategory !== 'all' && selectedCategory !== 'uncategorized') {
        queryInput.category_id = parseInt(selectedCategory);
      }
      
      const result = await trpc.getUserNotes.query(queryInput);
      setNotes(result);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [user.id, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getUserCategories.query({ user_id: user.id });
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Note operations
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newNote = await trpc.createNote.mutate(noteForm);
      setNotes((prev: Note[]) => [newNote, ...prev]);
      setNoteForm({
        title: '',
        content: '',
        user_id: user.id,
        category_id: null
      });
      setIsNoteDialogOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    
    setIsLoading(true);
    try {
      const updatedNote = await trpc.updateNote.mutate({
        id: editingNote.id,
        title: noteForm.title,
        content: noteForm.content,
        user_id: user.id,
        category_id: noteForm.category_id
      });
      setNotes((prev: Note[]) => prev.map((note: Note) => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      setEditingNote(null);
      setIsNoteDialogOpen(false);
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await trpc.deleteNote.mutate({ id: noteId, user_id: user.id });
      setNotes((prev: Note[]) => prev.filter((note: Note) => note.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Category operations
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCategory = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setCategoryForm({ name: '', user_id: user.id });
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await trpc.deleteCategory.mutate({ id: categoryId, user_id: user.id });
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== categoryId));
      if (selectedCategory === categoryId.toString()) {
        setSelectedCategory('all');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // UI helpers
  const openNoteDialog = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({
        title: note.title,
        content: note.content,
        user_id: user.id,
        category_id: note.category_id
      });
    } else {
      setEditingNote(null);
      setNoteForm({
        title: '',
        content: '',
        user_id: user.id,
        category_id: null
      });
    }
    setIsNoteDialogOpen(true);
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return null;
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Filter notes
  const filteredNotes = notes.filter((note: Note) => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen pastel-bg">
      {/* Header */}
      <header className="pastel-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light pastel-accent">📝 Notes</h1>
            <Badge variant="secondary" className="pastel-secondary">
              {user.email}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="border-gray-300 hover:bg-gray-100 pastel-accent"
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="flex-1 border-gray-300 focus:border-blue-500"
          />
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 border-gray-300">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notes</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="pastel-primary" onClick={() => openNoteDialog()}>
                  ✏️ New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="pastel-card">
                <DialogHeader>
                  <DialogTitle className="pastel-accent">
                    {editingNote ? 'Edit Note' : 'Create New Note'}
                  </DialogTitle>
                  <DialogDescription className="pastel-muted">
                    {editingNote ? 'Update your note below.' : 'Capture your thoughts and ideas.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={editingNote ? handleUpdateNote : handleCreateNote}>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Note title"
                      value={noteForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNoteForm((prev: CreateNoteInput) => ({ ...prev, title: e.target.value }))
                      }
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                    <Select
                      value={noteForm.category_id?.toString() || 'none'}
                      onValueChange={(value) =>
                        setNoteForm((prev: CreateNoteInput) => ({
                          ...prev,
                          category_id: value === 'none' ? null : parseInt(value)
                        }))
                      }
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Write your note here..."
                      value={noteForm.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNoteForm((prev: CreateNoteInput) => ({ ...prev, content: e.target.value }))
                      }
                      className="min-h-32 border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="pastel-primary" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="pastel-secondary">
                  🏷️ New Category
                </Button>
              </DialogTrigger>
              <DialogContent className="pastel-card">
                <DialogHeader>
                  <DialogTitle className="pastel-accent">Create Category</DialogTitle>
                  <DialogDescription className="pastel-muted">
                    Organize your notes with categories.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCategory}>
                  <div className="py-4">
                    <Input
                      placeholder="Category name"
                      value={categoryForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                      }
                      className="border-gray-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="pastel-primary" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium pastel-accent mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category: Category) => (
                <div key={category.id} className="group relative">
                  <Badge className="pastel-secondary pr-8">
                    {category.name}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        className="absolute right-1 top-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        aria-label="Delete category"
                      >
                        ×
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="pastel-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{category.name}"? Notes in this category will become uncategorized.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium pastel-accent mb-2">No notes yet</h3>
            <p className="pastel-muted mb-4">Create your first note to get started!</p>
            <Button className="pastel-primary" onClick={() => openNoteDialog()}>
              Create Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note: Note) => (
              <Card key={note.id} className="pastel-card hover:shadow-md transition-shadow group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-medium pastel-accent line-clamp-1">
                      {note.title}
                    </CardTitle>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openNoteDialog(note)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        ✏️
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 text-red-500"
                          >
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="pastel-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Note</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{note.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteNote(note.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {getCategoryName(note.category_id) && (
                    <Badge variant="secondary" className="w-fit pastel-secondary text-xs">
                      {getCategoryName(note.category_id)}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm pastel-muted line-clamp-4 mb-3">
                    {note.content}
                  </p>
                  <p className="text-xs pastel-muted">
                    Updated {note.updated_at.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
