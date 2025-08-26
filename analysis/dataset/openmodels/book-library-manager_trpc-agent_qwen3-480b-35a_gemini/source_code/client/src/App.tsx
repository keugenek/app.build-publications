import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { Book, CreateBookInput, UpdateBookInput, BookStatus } from '../../server/src/schema';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [formData, setFormData] = useState<CreateBookInput>({
    title: '',
    author: '',
    genre: null,
    status: 'to_read'
  });

  const loadBooks = useCallback(async () => {
    try {
      const result = await trpc.getBooks.query();
      setBooks(result);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingBook) {
        // Update existing book
        const updateData: UpdateBookInput = {
          id: editingBook.id,
          title: formData.title || undefined,
          author: formData.author || undefined,
          genre: formData.genre,
          status: formData.status
        };
        const updatedBook = await trpc.updateBook.mutate(updateData);
        setBooks(books.map(book => (book.id === updatedBook.id ? updatedBook : book)));
      } else {
        // Create new book
        const newBook = await trpc.createBook.mutate(formData);
        setBooks([...books, newBook]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save book:', error);
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBook.mutate({ id });
      setBooks(books.filter(book => book.id !== id));
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      genre: null,
      status: 'to_read'
    });
    setEditingBook(null);
  };

  const openEditDialog = (book: Book) => {
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: book.status
    });
    setEditingBook(book);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: BookStatus) => {
    switch (status) {
      case 'to_read': return 'secondary';
      case 'reading': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: BookStatus) => {
    switch (status) {
      case 'to_read': return 'To Read';
      case 'reading': return 'Reading';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-indigo-800 mb-2">Book Library</h1>
            <p className="text-lg text-indigo-600">Manage your personal book collection</p>
          </header>

          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select onValueChange={(value: BookStatus | 'all') => setStatusFilter(value)} value={statusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="to_read">To Read</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>Add New Book</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Book title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      placeholder="Author name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      value={formData.genre || ''}
                      onChange={(e) => setFormData({...formData, genre: e.target.value || null})}
                      placeholder="Genre (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value: BookStatus) => setFormData({...formData, status: value})} value={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to_read">To Read</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (editingBook ? 'Updating...' : 'Adding...') : (editingBook ? 'Update Book' : 'Add Book')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
              <p className="text-gray-500">
                {books.length === 0 
                  ? "Add your first book to get started!" 
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl pr-2">{book.title}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(book.status)}>
                        {getStatusText(book.status)}
                      </Badge>
                    </div>
                    <p className="text-lg text-gray-600">by {book.author}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {book.genre && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-500">Genre:</span>
                        <span className="ml-2 text-sm">{book.genre}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-500">
                        Added: {book.created_at.toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditDialog(book)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(book.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>Manage your book collection with ease</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
