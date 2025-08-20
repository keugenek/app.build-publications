import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Sample input for creating a book
const testInput: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Classic',
  reading_status: 'to_read',
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book and return all fields', async () => {
    const result = await createBook(testInput);

    expect(result.id).toBeDefined();
    expect(result.title).toBe(testInput.title);
    expect(result.author).toBe(testInput.author);
    expect(result.genre).toBe(testInput.genre);
    expect(result.reading_status).toBe(testInput.reading_status);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the book in the database', async () => {
    const created = await createBook(testInput);

    const rows = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const dbBook = rows[0];
    expect(dbBook.title).toBe(testInput.title);
    expect(dbBook.author).toBe(testInput.author);
    expect(dbBook.genre).toBe(testInput.genre);
    expect(dbBook.reading_status).toBe(testInput.reading_status);
    expect(dbBook.created_at).toBeInstanceOf(Date);
  });
});
