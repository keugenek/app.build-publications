import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { getBooks } from '../handlers/get_books';
import { eq } from 'drizzle-orm';

const testBook = {
  title: 'Test Title',
  author: 'Test Author',
  genre: 'Fantasy',
  reading_status: 'to_read' as const,
};

describe('getBooks handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no books exist', async () => {
    const books = await getBooks();
    expect(books).toEqual([]);
  });

  it('should return all books from the database', async () => {
    // Insert a book directly via Drizzle
    const inserted = await db
      .insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const result = await getBooks();

    expect(result).toHaveLength(1);
    const book = result[0];
    const dbRow = inserted[0];

    // Verify fields match
    expect(book.id).toBe(dbRow.id);
    expect(book.title).toBe(testBook.title);
    expect(book.author).toBe(testBook.author);
    expect(book.genre).toBe(testBook.genre);
    expect(book.reading_status).toBe(testBook.reading_status);
    expect(book.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple books correctly', async () => {
    const booksToInsert = [
      { ...testBook, title: 'Book One' },
      { ...testBook, title: 'Book Two', reading_status: 'finished' as const },
    ];

    await db.insert(booksTable).values(booksToInsert).execute();

    const books = await getBooks();
    expect(books).toHaveLength(2);
    const titles = books.map((b) => b.title);
    expect(titles).toContain('Book One');
    expect(titles).toContain('Book Two');
  });
});
