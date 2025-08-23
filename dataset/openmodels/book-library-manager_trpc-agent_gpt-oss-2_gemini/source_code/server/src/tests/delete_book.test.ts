import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput, type Book } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Helper to create a book directly in DB for testing
const createTestBook = async (): Promise<Book> => {
  const [inserted] = await db
    .insert(booksTable)
    .values({
      title: 'Test Title',
      author: 'Test Author',
      genre: 'Fiction',
      reading_status: 'To Read',
    })
    .returning()
    .execute();
  return inserted as Book;
};

describe('deleteBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book and return its data', async () => {
    const book = await createTestBook();
    const input: DeleteBookInput = { id: book.id };

    const deleted = await deleteBook(input);

    // Verify returned data matches inserted book
    expect(deleted.id).toBe(book.id);
    expect(deleted.title).toBe(book.title);
    expect(deleted.author).toBe(book.author);
    expect(deleted.genre).toBe(book.genre);
    expect(deleted.reading_status).toBe(book.reading_status);
    expect(deleted.created_at).toEqual(book.created_at);

    // Verify the book no longer exists in DB
    const remaining = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, book.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent book', async () => {
    const input: DeleteBookInput = { id: 9999 };
    await expect(deleteBook(input)).rejects.toThrow(/not found/i);
  });
});
