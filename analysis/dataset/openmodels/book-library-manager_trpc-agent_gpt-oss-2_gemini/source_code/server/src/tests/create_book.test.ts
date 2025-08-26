import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test input covering all required fields
const testInput: CreateBookInput = {
  title: 'The Test Novel',
  author: 'Jane Doe',
  genre: 'Fiction',
  reading_status: 'To Read',
};

describe('createBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a new book and return the created record', async () => {
    const result = await createBook(testInput);

    // Returned fields validation
    expect(result.title).toBe(testInput.title);
    expect(result.author).toBe(testInput.author);
    expect(result.genre).toBe(testInput.genre);
    expect(result.reading_status).toBe(testInput.reading_status);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the book in the database', async () => {
    const result = await createBook(testInput);

    const rows = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const saved = rows[0];
    expect(saved.title).toBe(testInput.title);
    expect(saved.author).toBe(testInput.author);
    expect(saved.genre).toBe(testInput.genre);
    expect(saved.reading_status).toBe(testInput.reading_status);
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
