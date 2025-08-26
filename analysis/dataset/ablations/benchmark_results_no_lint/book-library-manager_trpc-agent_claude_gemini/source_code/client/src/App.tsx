import { useState, useEffect, useCallback } from 'react';
import { BookForm } from '@/components/BookForm';
import { BookList } from '@/components/BookList';
import { BookFilters } from '@/components/BookFilters';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Book, CreateBookInput, UpdateBookInput, FilterBooksInput } from '../../server/src/schema';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [filters, setFilters] = useState<FilterBooksInput>({});

  // Load books based on current filters
  const loadBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getBooks.query(filters);
      setBooks(result);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Load available genres
  const loadGenres = useCallback(async () => {
    try {
      const result = await trpc.getGenres.query();
      setGenres(result);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
    loadGenres();
  }, [loadBooks, loadGenres]);

  const handleCreateBook = async (data: CreateBookInput) => {
    try {
      const newBook = await trpc.createBook.mutate(data);
      setBooks((prev: Book[]) => [newBook, ...prev]);
      setIsCreateDialogOpen(false);
      // Reload genres in case a new one was added
      loadGenres();
    } catch (error) {
      console.error('Failed to create book:', error);
      throw error;
    }
  };

  const handleUpdateBook = async (data: UpdateBookInput) => {
    try {
      const updatedBook = await trpc.updateBook.mutate(data);
      if (updatedBook) {
        setBooks((prev: Book[]) =>
          prev.map((book: Book) => book.id === updatedBook.id ? updatedBook : book)
        );
        setEditingBook(null);
        // Reload genres in case a new one was added
        loadGenres();
      }
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      const result = await trpc.deleteBook.mutate({ id });
      if (result.success) {
        setBooks((prev: Book[]) => prev.filter((book: Book) => book.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const handleFiltersChange = (newFilters: FilterBooksInput) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Book Library</h1>
            <p className="text-gray-600">Manage your reading collection</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                Add New Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
              </DialogHeader>
              <BookForm
                onSubmit={(data) => handleCreateBook(data as CreateBookInput)}
                genres={genres}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <BookFilters
            genres={genres}
            onFiltersChange={handleFiltersChange}
            currentFilters={filters}
          />
        </div>

        {/* Book List */}
        <BookList
          books={books}
          isLoading={isLoading}
          onEdit={setEditingBook}
          onDelete={handleDeleteBook}
        />

        {/* Edit Dialog */}
        <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
            </DialogHeader>
            {editingBook && (
              <BookForm
                initialData={editingBook}
                onSubmit={(data) => handleUpdateBook(data as UpdateBookInput)}
                genres={genres}
                onCancel={() => setEditingBook(null)}
                isEditing
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
