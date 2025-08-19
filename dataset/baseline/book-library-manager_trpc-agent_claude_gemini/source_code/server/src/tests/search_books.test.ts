import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type SearchBooksInput, type CreateBookInput } from '../schema';
import { searchBooks } from '../handlers/search_books';

// Helper function to create test books
const createTestBook = async (bookData: Partial<CreateBookInput> & { title: string; author: string; genre: string }) => {
  const result = await db.insert(booksTable)
    .values({
      title: bookData.title,
      author: bookData.author,
      genre: bookData.genre,
      reading_status: bookData.reading_status || 'To Read',
      isbn: bookData.isbn || null,
      pages: bookData.pages || null,
      publication_year: bookData.publication_year || null,
      notes: bookData.notes || null
    })
    .returning()
    .execute();
  return result[0];
};

describe('searchBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test data for most tests
  const setupTestData = async () => {
    await createTestBook({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Classic Fiction',
      reading_status: 'Finished',
      isbn: '978-0-7432-7356-5',
      pages: 180,
      publication_year: 1925
    });

    await createTestBook({
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      genre: 'Classic Fiction',
      reading_status: 'Reading',
      pages: 281,
      publication_year: 1960
    });

    await createTestBook({
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      genre: 'Coming of Age',
      reading_status: 'To Read',
      pages: 234,
      publication_year: 1951
    });

    await createTestBook({
      title: 'Dune',
      author: 'Frank Herbert',
      genre: 'Science Fiction',
      reading_status: 'Finished',
      pages: 688,
      publication_year: 1965
    });

    await createTestBook({
      title: '1984',
      author: 'George Orwell',
      genre: 'Dystopian Fiction',
      reading_status: 'To Read',
      pages: 328,
      publication_year: 1949
    });
  };

  it('should return empty array when no books exist', async () => {
    const input: SearchBooksInput = {};
    const result = await searchBooks(input);

    expect(result).toEqual([]);
  });

  it('should return all books when no filters are provided', async () => {
    await setupTestData();

    const input: SearchBooksInput = {};
    const result = await searchBooks(input);

    expect(result).toHaveLength(5);
    expect(result.every(book => book.id && book.title && book.author)).toBe(true);
    expect(result.every(book => book.created_at instanceof Date)).toBe(true);
  });

  it('should perform case-insensitive general search across title, author, and genre', async () => {
    await setupTestData();

    // Search for "gatsby" (should match title)
    const titleSearch: SearchBooksInput = { query: 'gatsby' };
    const titleResult = await searchBooks(titleSearch);
    expect(titleResult).toHaveLength(1);
    expect(titleResult[0].title).toBe('The Great Gatsby');

    // Search for "fitzgerald" (should match author)
    const authorSearch: SearchBooksInput = { query: 'fitzgerald' };
    const authorResult = await searchBooks(authorSearch);
    expect(authorResult).toHaveLength(1);
    expect(authorResult[0].author).toBe('F. Scott Fitzgerald');

    // Search for "science" (should match genre)
    const genreSearch: SearchBooksInput = { query: 'science' };
    const genreResult = await searchBooks(genreSearch);
    expect(genreResult).toHaveLength(1);
    expect(genreResult[0].genre).toBe('Science Fiction');

    // Search for "fiction" (should match multiple books by genre)
    const multipleSearch: SearchBooksInput = { query: 'fiction' };
    const multipleResult = await searchBooks(multipleSearch);
    expect(multipleResult.length).toBeGreaterThan(1);
  });

  it('should filter by specific title', async () => {
    await setupTestData();

    const input: SearchBooksInput = { title: 'mockingbird' };
    const result = await searchBooks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('To Kill a Mockingbird');
  });

  it('should filter by specific author', async () => {
    await setupTestData();

    const input: SearchBooksInput = { author: 'orwell' };
    const result = await searchBooks(input);

    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('George Orwell');
    expect(result[0].title).toBe('1984');
  });

  it('should filter by specific genre', async () => {
    await setupTestData();

    const input: SearchBooksInput = { genre: 'classic fiction' };
    const result = await searchBooks(input);

    expect(result).toHaveLength(2);
    expect(result.every(book => book.genre === 'Classic Fiction')).toBe(true);
  });

  it('should filter by reading status', async () => {
    await setupTestData();

    const input: SearchBooksInput = { reading_status: 'Finished' };
    const result = await searchBooks(input);

    expect(result).toHaveLength(2);
    expect(result.every(book => book.reading_status === 'Finished')).toBe(true);

    // Test other reading statuses
    const readingInput: SearchBooksInput = { reading_status: 'Reading' };
    const readingResult = await searchBooks(readingInput);
    expect(readingResult).toHaveLength(1);
    expect(readingResult[0].reading_status).toBe('Reading');

    const toReadInput: SearchBooksInput = { reading_status: 'To Read' };
    const toReadResult = await searchBooks(toReadInput);
    expect(toReadResult).toHaveLength(2);
    expect(toReadResult.every(book => book.reading_status === 'To Read')).toBe(true);
  });

  it('should combine multiple filters correctly', async () => {
    await setupTestData();

    // Search for classic fiction books that are finished
    const input: SearchBooksInput = { 
      genre: 'classic fiction',
      reading_status: 'Finished'
    };
    const result = await searchBooks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('The Great Gatsby');
    expect(result[0].genre).toBe('Classic Fiction');
    expect(result[0].reading_status).toBe('Finished');
  });

  it('should combine general query with specific filters', async () => {
    await setupTestData();

    // Search for "the" in general query but only "To Read" status
    const input: SearchBooksInput = { 
      query: 'the',
      reading_status: 'To Read'
    };
    const result = await searchBooks(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('The Catcher in the Rye');
    expect(result[0].reading_status).toBe('To Read');
  });

  it('should handle pagination correctly', async () => {
    await setupTestData();

    // Test first page
    const firstPage: SearchBooksInput = { limit: 2, offset: 0 };
    const firstResult = await searchBooks(firstPage);
    expect(firstResult).toHaveLength(2);

    // Test second page
    const secondPage: SearchBooksInput = { limit: 2, offset: 2 };
    const secondResult = await searchBooks(secondPage);
    expect(secondResult).toHaveLength(2);

    // Test third page
    const thirdPage: SearchBooksInput = { limit: 2, offset: 4 };
    const thirdResult = await searchBooks(thirdPage);
    expect(thirdResult).toHaveLength(1);

    // Ensure no overlap between pages
    const firstIds = firstResult.map(book => book.id);
    const secondIds = secondResult.map(book => book.id);
    const thirdIds = thirdResult.map(book => book.id);

    expect(firstIds.some(id => secondIds.includes(id))).toBe(false);
    expect(secondIds.some(id => thirdIds.includes(id))).toBe(false);
    expect(firstIds.some(id => thirdIds.includes(id))).toBe(false);
  });

  it('should respect default pagination values', async () => {
    await setupTestData();

    // Test with no pagination specified (should use defaults)
    const input: SearchBooksInput = {};
    const result = await searchBooks(input);

    expect(result).toHaveLength(5); // All books should be returned with default limit of 50
  });

  it('should order results by created_at descending', async () => {
    // Create books with slight delays to ensure different timestamps
    const firstBook = await createTestBook({
      title: 'First Book',
      author: 'Author One',
      genre: 'Test Genre'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondBook = await createTestBook({
      title: 'Second Book',
      author: 'Author Two',
      genre: 'Test Genre'
    });

    const input: SearchBooksInput = {};
    const result = await searchBooks(input);

    expect(result).toHaveLength(2);
    // Most recently created should be first (descending order)
    expect(result[0].id).toBe(secondBook.id);
    expect(result[1].id).toBe(firstBook.id);
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array when no matches found', async () => {
    await setupTestData();

    const input: SearchBooksInput = { query: 'nonexistent book title' };
    const result = await searchBooks(input);

    expect(result).toEqual([]);
  });

  it('should handle edge cases with empty strings', async () => {
    await setupTestData();

    // Empty query should return all books
    const emptyQuery: SearchBooksInput = { query: '' };
    const result = await searchBooks(emptyQuery);
    expect(result).toHaveLength(5);

    // Empty specific filters should return all books
    const emptyFilters: SearchBooksInput = { title: '', author: '', genre: '' };
    const emptyResult = await searchBooks(emptyFilters);
    expect(emptyResult).toHaveLength(5);
  });

  it('should handle partial matches correctly', async () => {
    await setupTestData();

    // Partial title match
    const partialTitle: SearchBooksInput = { title: 'great' };
    const titleResult = await searchBooks(partialTitle);
    expect(titleResult).toHaveLength(1);
    expect(titleResult[0].title).toBe('The Great Gatsby');

    // Partial author match
    const partialAuthor: SearchBooksInput = { author: 'scott' };
    const authorResult = await searchBooks(partialAuthor);
    expect(authorResult).toHaveLength(1);
    expect(authorResult[0].author).toBe('F. Scott Fitzgerald');
  });
});
