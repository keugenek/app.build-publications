import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookForm } from '@/components/BookForm';
import { BookCard } from '@/components/BookCard';
import { trpc } from '@/utils/trpc';
import type { Book, CreateBookInput, UpdateBookInput, FilterBooksInput } from '../../server/src/schema';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterBooksInput>({
    search: '',
    genre: '',
    status: undefined
  });
  
  // Get unique genres for filter dropdown
  const uniqueGenres = [...new Set(books.map(book => book.genre))];

  const loadBooks = useCallback(async () => {
    try {
      const result = await trpc.getBooks.query(filters);
      setBooks(result);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, [filters]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  

  const handleCreateBook = async (data: CreateBookInput) => {
    setIsLoading(true);
    try {
      const newBook = await trpc.createBook.mutate(data);
      setBooks(prev => [...prev, newBook]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBook = async (data: Omit<UpdateBookInput, 'id'>) => {
    if (!currentBook) return;
    
    setIsLoading(true);
    try {
      const updatedBook = await trpc.updateBook.mutate({
        id: currentBook.id,
        ...data
      });
      
      setBooks(prev => 
        prev.map(book => book.id === updatedBook.id ? updatedBook : book)
      );
      setIsEditDialogOpen(false);
      setCurrentBook(null);
    } catch (error) {
      console.error('Failed to update book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      await trpc.deleteBook.mutate({ id });
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const handleEditBook = (book: Book) => {
    setCurrentBook(book);
    setIsEditDialogOpen(true);
  };

  const handleFilterChange = (key: keyof FilterBooksInput, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Book Library</h1>
          <p className="text-muted-foreground">Manage your personal book collection</p>
        </header>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search books by title or author..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={filters.genre || 'all'} 
              onValueChange={(value) => handleFilterChange('genre', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {uniqueGenres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="to-read">To Read</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Book</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                </DialogHeader>
                <BookForm 
                  onSubmit={handleCreateBook} 
                  isLoading={isLoading} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground mb-4">
              {books.length === 0 
                ? "Your library is empty. Add your first book!" 
                : "No books match your current filters."}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>Add Your First Book</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
              />
            ))}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setCurrentBook(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
            </DialogHeader>
            {currentBook && (
              <BookForm 
                onSubmit={handleUpdateBook} 
                isLoading={isLoading} 
                initialData={currentBook}
                submitButtonText="Update Book"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
