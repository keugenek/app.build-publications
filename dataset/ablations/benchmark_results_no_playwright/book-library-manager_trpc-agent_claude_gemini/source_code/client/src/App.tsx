import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookForm } from '@/components/BookForm';
import { BookCard } from '@/components/BookCard';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { trpc } from '@/utils/trpc';
import type { Book, ReadingStatus } from '../../server/src/schema';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');

  // Load books with current filters
  const loadBooks = useCallback(async () => {
    try {
      const query = {
        search: searchTerm || undefined,
        genre: genreFilter === 'all' ? undefined : genreFilter,
        reading_status: statusFilter === 'all' ? undefined : statusFilter
      };
      
      const result = await trpc.getBooks.query(query);
      setBooks(result);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, [searchTerm, genreFilter, statusFilter]);

  // Load genres for filter dropdown
  const loadGenres = useCallback(async () => {
    try {
      const result = await trpc.getGenres.query();
      setGenres(result);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadBooks();
    loadGenres();
  }, [loadBooks, loadGenres]);

  // Handle book creation
  const handleCreateBook = async (bookData: { title: string; author: string; genre: string; reading_status: ReadingStatus }) => {
    setIsLoading(true);
    try {
      const newBook = await trpc.createBook.mutate(bookData);
      setBooks(prev => [...prev, newBook]);
      // Refresh genres in case a new one was added
      await loadGenres();
    } catch (error) {
      console.error('Failed to create book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle book update
  const handleUpdateBook = async (bookData: { title?: string; author?: string; genre?: string; reading_status?: ReadingStatus }) => {
    if (!editingBook) return;
    
    setIsLoading(true);
    try {
      const updatedBook = await trpc.updateBook.mutate({
        id: editingBook.id,
        ...bookData
      });
      
      setBooks(prev => prev.map(book => 
        book.id === editingBook.id ? updatedBook : book
      ));
      setEditingBook(null);
      // Refresh genres in case a new one was added
      await loadGenres();
    } catch (error) {
      console.error('Failed to update book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle book deletion
  const handleDeleteBook = async (id: number) => {
    try {
      await trpc.deleteBook.mutate({ id });
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setGenreFilter('all');
    setStatusFilter('all');
  };

  // Get reading status badge variant
  const getStatusVariant = (status: ReadingStatus) => {
    switch (status) {
      case 'Read':
        return 'default';
      case 'Currently Reading':
        return 'secondary';
      case 'Want to Read':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Statistics
  const stats = {
    total: books.length,
    read: books.filter(b => b.reading_status === 'Read').length,
    currentlyReading: books.filter(b => b.reading_status === 'Currently Reading').length,
    wantToRead: books.filter(b => b.reading_status === 'Want to Read').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Shared Book Library
          </h1>
          <p className="text-lg text-gray-600">
            Discover, track, and share your reading journey with the community
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="stat-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Books</div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.read}</div>
              <div className="text-sm text-gray-500">Read</div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.currentlyReading}</div>
              <div className="text-sm text-gray-500">Reading</div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.wantToRead}</div>
              <div className="text-sm text-gray-500">Want to Read</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Book Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingBook ? '✏️ Edit Book' : '➕ Add New Book'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookForm
                  onSubmit={editingBook ? handleUpdateBook : handleCreateBook}
                  isLoading={isLoading}
                  initialData={editingBook || undefined}
                  genres={genres}
                />
                {editingBook && (
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingBook(null)}
                    className="w-full mt-2"
                  >
                    Cancel Edit
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Books List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📖 Library Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <div className="mb-6">
                  <SearchAndFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    genreFilter={genreFilter}
                    onGenreFilterChange={setGenreFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    genres={genres}
                    onClearFilters={clearFilters}
                    resultsCount={books.length}
                  />
                </div>

                {books.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-500 text-lg">
                      {searchTerm || genreFilter !== 'all' || statusFilter !== 'all' 
                        ? 'No books match your current filters.' 
                        : 'No books in the library yet. Add the first one!'}
                    </p>
                    {(searchTerm || genreFilter !== 'all' || statusFilter !== 'all') && (
                      <Button variant="outline" onClick={clearFilters} className="mt-4">
                        Show All Books
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto books-scroll">
                    {books.map((book: Book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onEdit={setEditingBook}
                        onDelete={handleDeleteBook}
                        statusVariant={getStatusVariant(book.reading_status)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Note about stub implementation */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This application currently uses stub backend implementations. 
            Book data is not persisted between sessions. The backend handlers need to be 
            implemented with actual database operations for full functionality.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
