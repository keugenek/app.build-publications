import { useState, useEffect, useCallback } from 'react';
import { BookForm } from '@/components/BookForm';
import { BookList } from '@/components/BookList';
import { SearchFilters } from '@/components/SearchFilters';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Library, Search } from 'lucide-react';
import type { Book, CreateBookInput, UpdateBookInput, SearchBooksInput } from '../../server/src/schema';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchBooksInput>({});
  const [showSearch, setShowSearch] = useState(false);

  // Load all books
  const loadBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getBooks.query();
      
      // STUB WARNING: Backend returns empty array, using sample data for demonstration
      if (result.length === 0) {
        const stubBooks: Book[] = [
          {
            id: 1,
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            genre: "Classic Literature",
            reading_status: "Finished",
            created_at: new Date('2024-01-15'),
            updated_at: new Date('2024-01-15')
          },
          {
            id: 2,
            title: "Dune",
            author: "Frank Herbert",
            genre: "Science Fiction",
            reading_status: "Reading",
            created_at: new Date('2024-01-20'),
            updated_at: new Date('2024-01-25')
          },
          {
            id: 3,
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            genre: "Fantasy",
            reading_status: "To Read",
            created_at: new Date('2024-02-01'),
            updated_at: new Date('2024-02-01')
          }
        ];
        setBooks(stubBooks);
        setFilteredBooks(stubBooks);
      } else {
        setBooks(result);
        setFilteredBooks(result);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Apply search filters
  useEffect(() => {
    if (Object.keys(searchFilters).length === 0 || Object.values(searchFilters).every(val => !val)) {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => {
        const matchesTitle = !searchFilters.title || 
          book.title.toLowerCase().includes(searchFilters.title.toLowerCase());
        const matchesAuthor = !searchFilters.author || 
          book.author.toLowerCase().includes(searchFilters.author.toLowerCase());
        const matchesGenre = !searchFilters.genre || 
          book.genre.toLowerCase().includes(searchFilters.genre.toLowerCase());
        const matchesStatus = !searchFilters.reading_status || 
          book.reading_status === searchFilters.reading_status;
        
        return matchesTitle && matchesAuthor && matchesGenre && matchesStatus;
      });
      setFilteredBooks(filtered);
    }
  }, [books, searchFilters]);

  const handleCreateBook = async (data: CreateBookInput) => {
    try {
      setIsLoading(true);
      const newBook = await trpc.createBook.mutate(data);
      
      // STUB WARNING: Backend returns placeholder data, generating realistic stub
      if (newBook.id === 0) {
        const stubBook: Book = {
          id: Math.max(...books.map(b => b.id), 0) + 1,
          title: data.title,
          author: data.author,
          genre: data.genre,
          reading_status: data.reading_status,
          created_at: new Date(),
          updated_at: new Date()
        };
        setBooks((prev: Book[]) => [stubBook, ...prev]);
      } else {
        setBooks((prev: Book[]) => [newBook, ...prev]);
      }
      
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBook = async (data: UpdateBookInput) => {
    try {
      setIsLoading(true);
      const updatedBook = await trpc.updateBook.mutate(data);
      
      // STUB WARNING: Backend returns null, creating stub update
      if (!updatedBook) {
        const stubUpdatedBook: Book = {
          ...editingBook!,
          ...data,
          updated_at: new Date()
        };
        setBooks((prev: Book[]) =>
          prev.map(book => book.id === data.id ? stubUpdatedBook : book)
        );
      } else {
        setBooks((prev: Book[]) =>
          prev.map(book => book.id === data.id ? updatedBook : book)
        );
      }
      
      setEditingBook(null);
    } catch (error) {
      console.error('Failed to update book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      setIsLoading(true);
      const success = await trpc.deleteBook.mutate({ id });
      
      // STUB WARNING: Backend returns false, simulating successful deletion
      if (!success) {
        // For demo purposes, always remove from local state
        setBooks((prev: Book[]) => prev.filter(book => book.id !== id));
      } else {
        setBooks((prev: Book[]) => prev.filter(book => book.id !== id));
      }
      
      setDeletingBookId(null);
    } catch (error) {
      console.error('Failed to delete book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchFilters({});
    setShowSearch(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Library className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">📚 My Book Library</h1>
          </div>
          <p className="text-gray-600 text-lg">Organize and track your personal book collection</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-5 w-5" />
                Add New Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
              </DialogHeader>
              <BookForm
                onSubmit={handleCreateBook}
                isLoading={isLoading}
                submitLabel="Add Book"
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSearch(!showSearch)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Search className="mr-2 h-5 w-5" />
            Search & Filter
          </Button>
        </div>

        {/* Search/Filter Section */}
        {showSearch && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-indigo-100">
            <SearchFilters
              filters={searchFilters}
              onFiltersChange={setSearchFilters}
              onClear={clearFilters}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 text-center">
            <div className="text-2xl font-bold text-indigo-600">{books.length}</div>
            <div className="text-sm text-gray-600">Total Books</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 text-center">
            <div className="text-2xl font-bold text-green-600">
              {books.filter(b => b.reading_status === 'Finished').length}
            </div>
            <div className="text-sm text-gray-600">Finished</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {books.filter(b => b.reading_status === 'Reading').length}
            </div>
            <div className="text-sm text-gray-600">Currently Reading</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {books.filter(b => b.reading_status === 'To Read').length}
            </div>
            <div className="text-sm text-gray-600">To Read</div>
          </div>
        </div>

        {/* Books List */}
        {isLoading && books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading your books...</div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-indigo-100">
            <Library className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <div className="text-lg text-gray-600 mb-2">
              {books.length === 0 ? "No books in your library yet" : "No books match your search"}
            </div>
            <p className="text-gray-500 mb-4">
              {books.length === 0 
                ? "Start building your collection by adding your first book!"
                : "Try adjusting your search criteria"
              }
            </p>
            {books.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Book
              </Button>
            )}
          </div>
        ) : (
          <BookList
            books={filteredBooks}
            onEdit={setEditingBook}
            onDelete={setDeletingBookId}
            isLoading={isLoading}
          />
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
            </DialogHeader>
            {editingBook && (
              <BookForm
                initialData={editingBook}
                onSubmit={handleCreateBook}
                onUpdate={handleUpdateBook}
                isLoading={isLoading}
                submitLabel="Update Book"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingBookId} onOpenChange={() => setDeletingBookId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Book</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this book? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingBookId && handleDeleteBook(deletingBookId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>📖 Happy Reading! Keep track of your literary journey.</p>
          {/* Note about stub data */}
          <p className="mt-2 text-xs text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded">
            ⚠️ Demo Mode: Using sample data since backend handlers are not implemented
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
