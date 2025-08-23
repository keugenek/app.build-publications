import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { getBooks } from '../handlers/get_books';
import { eq } from 'drizzle-orm';

// Helper to insert a book directly
const insertBook = async (book: Omit<Book, 'id' | 'created_at'>) => {
  const result = await db.insert(booksTable).values(book).returning().execute();
  return result[0];
};

describe('getBooks handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all books from the database', async () => {
    // Insert two books
    const book1 = await insertBook({
      title: '1984',
      author: 'George Orwell',
      genre: 'Dystopian',
      reading_status: 'To Read'
    });
    const book2 = await insertBook({
      title: 'Brave New World',
      author: 'Aldous Huxley',
      genre: 'Science Fiction',
      reading_status: 'Reading'
    });

    const books = await getBooks();

    // Verify both books are returned
    expect(books).toHaveLength(2);
    const titles = books.map(b => b.title);
    expect(titles).toContain('1984');
    expect(titles).toContain('Brave New World');

    // Verify fields match inserted data
    const fetched1 = books.find(b => b.title === '1984')!;
    expect(fetched1.author).toBe('George Orwell');
    expect(fetched1.genre).toBe('Dystopian');
    expect(fetched1.reading_status).toBe('To Read');
    expect(fetched1.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no books exist', async () => {
    const books = await getBooks();
    expect(books).toEqual([]);
  });
});
