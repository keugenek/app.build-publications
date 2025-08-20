import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput, type Book } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Helper to create a book directly in the database
const createTestBook = async () => {
  const result = await db
    .insert(booksTable)
    .values({
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      reading_status: 'to_read',
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book and return its data', async () => {
    const inserted = await createTestBook();

    const input: DeleteBookInput = { id: inserted.id };
    const deleted: Book = await deleteBook(input);

    // Verify returned data matches the inserted record
    expect(deleted.id).toBe(inserted.id);
    expect(deleted.title).toBe(inserted.title);
    expect(deleted.author).toBe(inserted.author);
    expect(deleted.genre).toBe(inserted.genre);
    expect(deleted.reading_status).toBe(inserted.reading_status);
    expect(deleted.created_at).toEqual(inserted.created_at);

    // Ensure the book no longer exists in the database
    const remaining = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, inserted.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent book', async () => {
    const input: DeleteBookInput = { id: 9999 };
    await expect(deleteBook(input)).rejects.toThrow(/not found/i);
  });
});
