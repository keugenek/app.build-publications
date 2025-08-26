import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type SearchBooksInput, type Book } from '../schema';
import { searchBooks } from '../handlers/search_books';

// Helper to insert a book directly into the DB
const insertBook = async (book: Omit<Book, 'id' | 'created_at'>) => {
  const [inserted] = await db
    .insert(booksTable)
    .values({
      title: book.title,
      author: book.author,
      genre: book.genre,
      reading_status: book.reading_status,
    })
    .returning()
    .execute();
  return inserted;
};

// Sample books for testing
const sampleBooks = [
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    reading_status: 'Finished' as const,
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopia',
    reading_status: 'Reading' as const,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Science Fiction',
    reading_status: 'To Read' as const,
  },
];

describe('searchBooks handler', () => {
  beforeEach(async () => {
    await createDB();
    // Insert sample books
    for (const book of sampleBooks) {
      await insertBook(book);
    }
  });
  afterEach(resetDB);

  it('returns all books when no filters are provided', async () => {
    const input: SearchBooksInput = {};
    const results = await searchBooks(input);
    expect(results).toHaveLength(sampleBooks.length);
    const titles = results.map((b) => b.title).sort();
    expect(titles).toEqual(sampleBooks.map((b) => b.title).sort());
  });

  it('filters by title correctly', async () => {
    const input: SearchBooksInput = { title: 'Dune' };
    const results = await searchBooks(input);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Dune');
    expect(results[0].author).toBe('Frank Herbert');
  });

  it('filters by author correctly', async () => {
    const input: SearchBooksInput = { author: 'George Orwell' };
    const results = await searchBooks(input);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('1984');
  });

  it('filters by genre correctly', async () => {
    const input: SearchBooksInput = { genre: 'Fantasy' };
    const results = await searchBooks(input);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Hobbit');
  });

  it('filters by reading_status correctly', async () => {
    const input: SearchBooksInput = { reading_status: 'To Read' };
    const results = await searchBooks(input);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Dune');
  });

  it('applies multiple filters together (author + genre)', async () => {
    const input: SearchBooksInput = { author: 'J.R.R. Tolkien', genre: 'Fantasy' };
    const results = await searchBooks(input);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Hobbit');
  });

  it('returns empty array when filters do not match any record', async () => {
    const input: SearchBooksInput = { title: 'Nonexistent Book' };
    const results = await searchBooks(input);
    expect(results).toHaveLength(0);
  });
});
