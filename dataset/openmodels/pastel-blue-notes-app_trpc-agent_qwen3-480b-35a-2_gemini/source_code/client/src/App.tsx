import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthForm } from '@/components/AuthForm';
import { trpc } from '@/utils/trpc';
import type { Note, Category, CreateNoteInput, CreateCategoryInput, UpdateNoteInput } from '../../server/src/schema';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // State for notes and categories
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State for form inputs
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  
  // State for editing
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Dialog states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  // Check authentication status
  useEffect(() => {
    // In a real app, we would check for a valid session/token
    // For now, we'll simulate authentication
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Load notes and categories on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadNotes();
      loadCategories();
    }
  }, [isAuthenticated]);
  
  const loadNotes = async () => {
    try {
      const result = await trpc.getNotes.query();
      setNotes(result);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };
  
  const loadCategories = async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };
  
  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    
    try {
      const noteData: CreateNoteInput = {
        title: noteTitle,
        content: noteContent,
        category_id: selectedCategory
      };
      
      await trpc.createNote.mutate(noteData);
      resetNoteForm();
      setIsNoteDialogOpen(false);
      loadNotes(); // Refresh notes list
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };
  
  const handleUpdateNote = async () => {
    if (!editingNote || !noteTitle.trim() || !noteContent.trim()) return;
    
    try {
      const updateData: UpdateNoteInput = {
        id: editingNote.id,
        title: noteTitle,
        content: noteContent,
        category_id: selectedCategory
      };
      
      await trpc.updateNote.mutate(updateData);
      resetNoteForm();
      setEditingNote(null);
      setIsNoteDialogOpen(false);
      loadNotes(); // Refresh notes list
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };
  
  const handleDeleteNote = async (id: number) => {
    try {
      await trpc.deleteNote.mutate(id);
      loadNotes(); // Refresh notes list
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };
  
  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    
    try {
      const categoryData: CreateCategoryInput = {
        name: categoryName
      };
      
      await trpc.createCategory.mutate(categoryData);
      setCategoryName('');
      setIsCategoryDialogOpen(false);
      loadCategories(); // Refresh categories list
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };
  
  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return;
    
    try {
      await trpc.updateCategory.mutate({
        id: editingCategory.id,
        name: categoryName
      });
      setCategoryName('');
      setEditingCategory(null);
      setIsCategoryDialogOpen(false);
      loadCategories(); // Refresh categories list
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };
  
  const handleDeleteCategory = async (id: number) => {
    try {
      await trpc.deleteCategory.mutate(id);
      loadCategories(); // Refresh categories list
      // Also refresh notes since they might reference this category
      loadNotes();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };
  
  const resetNoteForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setSelectedCategory(null);
  };
  
  const openNewNoteDialog = () => {
    resetNoteForm();
    setEditingNote(null);
    setIsNoteDialogOpen(true);
  };
  
  const openEditNoteDialog = (note: Note) => {
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setSelectedCategory(note.category_id);
    setEditingNote(note);
    setIsNoteDialogOpen(true);
  };
  
  const openNewCategoryDialog = () => {
    setCategoryName('');
    setEditingCategory(null);
    setIsCategoryDialogOpen(true);
  };
  
  const openEditCategoryDialog = (category: Category) => {
    setCategoryName(category.name);
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };
  
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('authToken', 'dummy-token');
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-800">Minimal Notes</h1>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Logout
            </Button>
          </div>
          <p className="text-blue-600">Your minimalist note-taking app</p>
        </header>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openNewNoteDialog}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? 'Edit Note' : 'Create New Note'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Input
                    placeholder="Note title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="col-span-4"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Textarea
                    placeholder="Note content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="col-span-4 min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Select 
                    value={selectedCategory?.toString() || 'null'} 
                    onValueChange={(value) => setSelectedCategory(value === 'null' ? null : parseInt(value))}
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={editingNote ? handleUpdateNote : handleCreateNote}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {editingNote ? 'Update Note' : 'Create Note'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openNewCategoryDialog}
                className="bg-blue-400 hover:bg-blue-500 text-white"
              >
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Input
                    placeholder="Category name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="col-span-4"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                </div>
              </div>
              
              {/* Category list */}
              <div className="mt-6">
                <h3 className="font-medium text-blue-800 mb-2">Existing Categories</h3>
                {categories.length === 0 ? (
                  <p className="text-sm text-blue-600">No categories yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <div 
                        key={category.id} 
                        className="flex items-center justify-between p-2 bg-blue-50 rounded"
                      >
                        <span className="text-blue-800">{category.name}</span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openEditCategoryDialog(category)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-blue-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-blue-800 mb-2">No notes yet</h3>
            <p className="text-blue-600">Create your first note to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <Card 
                key={note.id} 
                className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-blue-800">{note.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditNoteDialog(note)}
                        className="text-xs h-8"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs h-8"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {note.category_id && (
                    <div className="text-xs text-blue-600 mt-1">
                      {categories.find(c => c.id === note.category_id)?.name || 'Unknown Category'}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-blue-900 whitespace-pre-wrap">{note.content}</p>
                  <div className="text-xs text-blue-500 mt-4">
                    Created: {note.created_at.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
