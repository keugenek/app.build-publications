import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

const testInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Jane Doe',
  genre: 'Fiction',
  reading_status: 'To Read',
};

describe('createBook handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a new book and return the created record', async () => {
    const result = await createBook(testInput);

    // Returned object should contain all fields
    expect(result.id).toBeGreaterThan(0);
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
    const persisted = rows[0];
    expect(persisted.title).toBe(testInput.title);
    expect(persisted.author).toBe(testInput.author);
    expect(persisted.genre).toBe(testInput.genre);
    expect(persisted.reading_status).toBe(testInput.reading_status);
    expect(persisted.created_at).toBeInstanceOf(Date);
  });
});
