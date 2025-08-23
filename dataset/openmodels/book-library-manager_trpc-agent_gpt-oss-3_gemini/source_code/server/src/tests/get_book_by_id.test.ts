import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getBookById } from '../handlers/get_book_by_id';
import { type Book } from '../schema';

const testBook = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Classic',
  reading_status: 'To Read' as const,
};

describe('getBookById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a book when it exists', async () => {
    // Insert a book directly
    const [inserted] = await db
      .insert(booksTable)
      .values({
        title: testBook.title,
        author: testBook.author,
        genre: testBook.genre,
        reading_status: testBook.reading_status,
      })
      .returning()
      .execute();

    const result = await getBookById(inserted.id);

    expect(result).not.toBeNull();
    const book = result as Book;
    expect(book.id).toBe(inserted.id);
    expect(book.title).toBe(testBook.title);
    expect(book.author).toBe(testBook.author);
    expect(book.genre).toBe(testBook.genre);
    expect(book.reading_status).toBe(testBook.reading_status);
    expect(book.created_at).toBeInstanceOf(Date);
  });

  it('should return null when the book does not exist', async () => {
    const result = await getBookById(9999);
    expect(result).toBeNull();
  });
});
