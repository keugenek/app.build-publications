import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, BookOpen, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Book, CreateBookInput, UpdateBookInput, ReadingStatus } from '../../server/src/schema';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for adding new books
  const [formData, setFormData] = useState<CreateBookInput>({
    title: '',
    author: '',
    genre: '',
    reading_status: 'To Read',
    isbn: null,
    pages: null,
    publication_year: null,
    notes: null
  });

  // Form state for editing books
  const [editFormData, setEditFormData] = useState<UpdateBookInput>({
    id: 0,
    title: '',
    author: '',
    genre: '',
    reading_status: 'To Read',
    isbn: null,
    pages: null,
    publication_year: null,
    notes: null
  });

  // Load books from API
  const loadBooks = useCallback(async () => {
    try {
      const result = await trpc.getBooks.query();
      setBooks(result);
      setFilteredBooks(result);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Filter books based on search query, status, and genre
  useEffect(() => {
    let filtered = [...books];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((book: Book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((book: Book) => book.reading_status === statusFilter);
    }

    // Genre filter
    if (genreFilter !== 'all') {
      filtered = filtered.filter((book: Book) => book.genre === genreFilter);
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery, statusFilter, genreFilter]);

  // Get unique genres for filter dropdown
  const uniqueGenres = Array.from(new Set(books.map((book: Book) => book.genre))).sort();

  // Handle adding new book
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createBook.mutate(formData);
      setBooks((prev: Book[]) => [response, ...prev]);
      // Reset form
      setFormData({
        title: '',
        author: '',
        genre: '',
        reading_status: 'To Read',
        isbn: null,
        pages: null,
        publication_year: null,
        notes: null
      });
    } catch (error) {
      console.error('Failed to create book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating book
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateBook.mutate(editFormData);
      setBooks((prev: Book[]) =>
        prev.map((book: Book) => book.id === response.id ? response : book)
      );
      setIsEditDialogOpen(false);
      setEditingBook(null);
    } catch (error) {
      console.error('Failed to update book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting book
  const handleDeleteBook = async (bookId: number) => {
    try {
      await trpc.deleteBook.mutate({ id: bookId });
      setBooks((prev: Book[]) => prev.filter((book: Book) => book.id !== bookId));
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  // Open edit dialog
  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setEditFormData({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      reading_status: book.reading_status,
      isbn: book.isbn,
      pages: book.pages,
      publication_year: book.publication_year,
      notes: book.notes
    });
    setIsEditDialogOpen(true);
  };

  // Get status badge color
  const getStatusColor = (status: ReadingStatus) => {
    switch (status) {
      case 'To Read': return 'bg-gray-500';
      case 'Reading': return 'bg-blue-500';
      case 'Finished': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGenreFilter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-blue-600" />
            📚 My Book Library
          </h1>
          <p className="text-gray-600">Organize and track your reading journey</p>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              My Library
            </TabsTrigger>
            <TabsTrigger value="add-book" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Book
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Search and Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by title, author, or genre..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={statusFilter || 'all'} onValueChange={(value: ReadingStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="To Read">To Read</SelectItem>
                      <SelectItem value="Reading">Reading</SelectItem>
                      <SelectItem value="Finished">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={genreFilter} onValueChange={(value: string) => setGenreFilter(value)}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {uniqueGenres.map((genre: string) => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchQuery || statusFilter !== 'all' || genreFilter !== 'all') && (
                    <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Books Grid */}
            {filteredBooks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {books.length === 0 ? 'No books yet!' : 'No books match your filters'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {books.length === 0 ? 'Start building your library by adding your first book.' : 'Try adjusting your search or filter criteria.'}
                  </p>
                  {books.length === 0 && (
                    <Button onClick={() => {
                      const addBookTab = document.querySelector('[value="add-book"]') as HTMLElement;
                      addBookTab?.click();
                    }} className="bg-blue-600 hover:bg-blue-700">
                      Add Your First Book 📖
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredBooks.map((book: Book) => (
                  <Card key={book.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                          <CardDescription className="mt-1">by {book.author}</CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(book.reading_status)} text-white`}>
                          {book.reading_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div><strong>Genre:</strong> {book.genre}</div>
                        {book.isbn && <div><strong>ISBN:</strong> {book.isbn}</div>}
                        {book.pages && <div><strong>Pages:</strong> {book.pages.toLocaleString()}</div>}
                        {book.publication_year && <div><strong>Published:</strong> {book.publication_year}</div>}
                        {book.notes && (
                          <div>
                            <strong>Notes:</strong>
                            <p className="text-gray-600 mt-1 line-clamp-3">{book.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-xs text-gray-500">
                          Added {book.created_at.toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(book)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="flex items-center gap-1">
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{book.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Add Book Tab */}
          <TabsContent value="add-book">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Book
                </CardTitle>
                <CardDescription>
                  Fill in the details to add a new book to your library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Book title"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author *</Label>
                      <Input
                        id="author"
                        placeholder="Author name"
                        value={formData.author}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookInput) => ({ ...prev, author: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre *</Label>
                      <Input
                        id="genre"
                        placeholder="e.g., Fiction, Science, Biography"
                        value={formData.genre}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookInput) => ({ ...prev, genre: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Reading Status</Label>
                      <Select value={formData.reading_status || 'To Read'} onValueChange={(value: ReadingStatus) => setFormData((prev: CreateBookInput) => ({ ...prev, reading_status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To Read">📚 To Read</SelectItem>
                          <SelectItem value="Reading">📖 Reading</SelectItem>
                          <SelectItem value="Finished">✅ Finished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        placeholder="ISBN number (optional)"
                        value={formData.isbn || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookInput) => ({ ...prev, isbn: e.target.value || null }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pages">Pages</Label>
                      <Input
                        id="pages"
                        type="number"
                        placeholder="Number of pages"
                        value={formData.pages || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookInput) => ({ ...prev, pages: parseInt(e.target.value) || null }))
                        }
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Publication Year</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="e.g., 2023"
                        value={formData.publication_year || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookInput) => ({ ...prev, publication_year: parseInt(e.target.value) || null }))
                        }
                        min="1000"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Personal Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Your thoughts, quotes, or reminders about this book..."
                      value={formData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateBookInput) => ({ ...prev, notes: e.target.value || null }))
                      }
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isLoading ? 'Adding Book...' : '📚 Add Book to Library'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Book Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Book
              </DialogTitle>
              <DialogDescription>
                Update the details for "{editingBook?.title}"
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateBookInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-author">Author *</Label>
                  <Input
                    id="edit-author"
                    value={editFormData.author || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateBookInput) => ({ ...prev, author: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-genre">Genre *</Label>
                  <Input
                    id="edit-genre"
                    value={editFormData.genre || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateBookInput) => ({ ...prev, genre: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Reading Status</Label>
                  <Select value={editFormData.reading_status || 'To Read'} onValueChange={(value: ReadingStatus) => setEditFormData((prev: UpdateBookInput) => ({ ...prev, reading_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Read">📚 To Read</SelectItem>
                      <SelectItem value="Reading">📖 Reading</SelectItem>
                      <SelectItem value="Finished">✅ Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-isbn">ISBN</Label>
                  <Input
                    id="edit-isbn"
                    value={editFormData.isbn || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateBookInput) => ({ ...prev, isbn: e.target.value || null }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pages">Pages</Label>
                  <Input
                    id="edit-pages"
                    type="number"
                    value={editFormData.pages || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateBookInput) => ({ ...prev, pages: parseInt(e.target.value) || null }))
                    }
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-year">Publication Year</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={editFormData.publication_year || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateBookInput) => ({ ...prev, publication_year: parseInt(e.target.value) || null }))
                    }
                    min="1000"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Personal Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateBookInput) => ({ ...prev, notes: e.target.value || null }))
                  }
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Updating...' : 'Update Book'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
