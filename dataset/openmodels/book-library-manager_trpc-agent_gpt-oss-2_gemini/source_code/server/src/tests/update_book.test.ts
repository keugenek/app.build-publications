import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Helper to insert a book directly
const insertBook = async (book: any): Promise<Book> => {
  const result = await db
    .insert(booksTable)
    .values(book)
    .returning()
    .execute();
  return result[0] as Book;
};

describe('updateBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and returns the updated record', async () => {
    const original = await insertBook({
      title: 'Original Title',
      author: 'Original Author',
      genre: 'Fantasy',
      reading_status: 'To Read' as const
    });

    const input: UpdateBookInput = {
      id: original.id,
      title: 'Updated Title',
      // author omitted on purpose
      genre: 'Science Fiction',
      reading_status: 'Reading',
    };

    const updated = await updateBook(input);

    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('Updated Title');
    // author should stay unchanged
    expect(updated.author).toBe(original.author);
    expect(updated.genre).toBe('Science Fiction');
    expect(updated.reading_status).toBe('Reading');
    // created_at should remain the same (or close)
    expect(updated.created_at.getTime()).toBe(original.created_at.getTime());
  });

  it('throws an error when the book does not exist', async () => {
    const input: UpdateBookInput = {
      id: 9999,
      title: 'Non‑existent',
    };
    await expect(updateBook(input)).rejects.toThrow('Book not found');
  });
});
