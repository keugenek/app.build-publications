import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteBook } from '../handlers/delete_book';

// Helper to insert a book directly
const insertBook = async (title: string, author: string, genre: string, reading_status: 'To Read' | 'Reading' | 'Finished') => {
  const result = await db
    .insert(booksTable)
    .values([ { title, author, genre, reading_status } ])
    .returning()
    .execute();
  return result[0];
};

describe('deleteBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book and return it', async () => {
    const inserted = await insertBook('Test Title', 'Test Author', 'Fiction', 'To Read');
    const deleted = await deleteBook(inserted.id);
    expect(deleted).not.toBeNull();
    expect(deleted?.id).toBe(inserted.id);
    expect(deleted?.title).toBe('Test Title');

    // Verify the book no longer exists in the DB
    const remaining = await db.select().from(booksTable).where(eq(booksTable.id, inserted.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should return null when trying to delete a non‑existent book', async () => {
    const result = await deleteBook(9999);
    expect(result).toBeNull();
  });
});
