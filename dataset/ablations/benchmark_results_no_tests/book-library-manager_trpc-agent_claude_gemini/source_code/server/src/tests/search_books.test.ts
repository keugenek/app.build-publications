import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type SearchBooksInput, type CreateBookInput } from '../schema';
import { searchBooks } from '../handlers/search_books';

// Test data for creating books
const testBooks: CreateBookInput[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Classic Fiction',
    reading_status: 'Finished'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Classic Fiction',
    reading_status: 'Reading'
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romance',
    reading_status: 'To Read'
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    genre: 'Coming-of-age',
    reading_status: 'Finished'
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    genre: 'Technology',
    reading_status: 'Reading'
  }
];

describe('searchBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test books
  const createTestBooks = async () => {
    const books = [];
    for (const bookData of testBooks) {
      const result = await db.insert(booksTable)
        .values(bookData)
        .returning()
        .execute();
      books.push(result[0]);
    }
    return books;
  };

  it('should return all books when no filters are provided', async () => {
    await createTestBooks();

    const result = await searchBooks({});

    expect(result).toHaveLength(5);
    // Should be ordered by creation date (newest first)
    expect(result[0].title).toEqual('JavaScript: The Good Parts');
    expect(result[4].title).toEqual('The Great Gatsby');
  });

  it('should filter by title with case-insensitive partial match', async () => {
    await createTestBooks();

    const result = await searchBooks({ title: 'great' });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Great Gatsby');
    expect(result[0].author).toEqual('F. Scott Fitzgerald');
  });

  it('should filter by author with case-insensitive partial match', async () => {
    await createTestBooks();

    const result = await searchBooks({ author: 'jane' });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Pride and Prejudice');
    expect(result[0].author).toEqual('Jane Austen');
  });

  it('should filter by genre with case-insensitive partial match', async () => {
    await createTestBooks();

    const result = await searchBooks({ genre: 'classic' });

    expect(result).toHaveLength(2);
    expect(result.map(book => book.title)).toContain('The Great Gatsby');
    expect(result.map(book => book.title)).toContain('To Kill a Mockingbird');
  });

  it('should filter by reading_status with exact match', async () => {
    await createTestBooks();

    const result = await searchBooks({ reading_status: 'Reading' });

    expect(result).toHaveLength(2);
    expect(result.map(book => book.title)).toContain('To Kill a Mockingbird');
    expect(result.map(book => book.title)).toContain('JavaScript: The Good Parts');
  });

  it('should combine multiple filters with AND logic', async () => {
    await createTestBooks();

    const result = await searchBooks({
      genre: 'classic',
      reading_status: 'Finished'
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Great Gatsby');
    expect(result[0].genre).toEqual('Classic Fiction');
    expect(result[0].reading_status).toEqual('Finished');
  });

  it('should return empty array when no matches found', async () => {
    await createTestBooks();

    const result = await searchBooks({ title: 'Nonexistent Book' });

    expect(result).toHaveLength(0);
  });

  it('should handle partial matches in title correctly', async () => {
    await createTestBooks();

    const result = await searchBooks({ title: 'the' });

    expect(result).toHaveLength(3);
    expect(result.map(book => book.title)).toContain('The Great Gatsby');
    expect(result.map(book => book.title)).toContain('The Catcher in the Rye');
    expect(result.map(book => book.title)).toContain('JavaScript: The Good Parts');
  });

  it('should handle multiple criteria with partial matches', async () => {
    await createTestBooks();

    const result = await searchBooks({
      author: 'j',
      reading_status: 'Finished'
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Catcher in the Rye');
    expect(result[0].author).toEqual('J.D. Salinger');
  });

  it('should return results ordered by creation date (newest first)', async () => {
    await createTestBooks();

    const result = await searchBooks({ genre: 'fiction' });

    expect(result).toHaveLength(2);
    // Newer books should come first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should validate that all returned books have required fields', async () => {
    await createTestBooks();

    const result = await searchBooks({});

    expect(result.length).toBeGreaterThan(0);
    result.forEach(book => {
      expect(book.id).toBeDefined();
      expect(typeof book.id).toBe('number');
      expect(book.title).toBeDefined();
      expect(typeof book.title).toBe('string');
      expect(book.author).toBeDefined();
      expect(typeof book.author).toBe('string');
      expect(book.genre).toBeDefined();
      expect(typeof book.genre).toBe('string');
      expect(book.reading_status).toBeDefined();
      expect(['To Read', 'Reading', 'Finished']).toContain(book.reading_status);
      expect(book.created_at).toBeInstanceOf(Date);
      expect(book.updated_at).toBeInstanceOf(Date);
    });
  });
});
