import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateBook } from '../handlers/update_book';
import { type UpdateBookInput } from '../schema';

// Helper to insert a book directly
const insertBook = async (title: string, author: string, genre: string, reading_status: 'To Read' | 'Reading' | 'Finished') => {
  const result = await db
    .insert(booksTable)
    .values({ title, author, genre, reading_status } as any)
    .returning()
    .execute();
  return result[0];
};

describe('updateBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and returns the updated book', async () => {
    const original = await insertBook('Original Title', 'Original Author', 'Fantasy', 'To Read');

    const input: UpdateBookInput = {
      id: original.id,
      title: 'Updated Title',
      reading_status: 'Reading',
    };

    const updated = await updateBook(input);

    expect(updated).not.toBeNull();
    expect(updated?.id).toBe(original.id);
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.reading_status).toBe('Reading');
    // unchanged fields remain the same
    expect(updated?.author).toBe(original.author);
    expect(updated?.genre).toBe(original.genre);

    // Verify persisted in DB
    const persisted = await db.select().from(booksTable).where(eq(booksTable.id, original.id)).execute();
    expect(persisted).toHaveLength(1);
    const row = persisted[0];
    expect(row.title).toBe('Updated Title');
    expect(row.reading_status).toBe('Reading');
  });

  it('returns null when no updatable fields are provided', async () => {
    const original = await insertBook('Title', 'Author', 'Sci-Fi', 'To Read');
    const input: UpdateBookInput = { id: original.id };
    const result = await updateBook(input);
    expect(result).toBeNull();
  });
});
