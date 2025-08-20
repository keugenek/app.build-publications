import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Fiction',
  reading_status: 'To Read'
};

// Test input with explicit reading_status for minimal case
const testInputMinimal: CreateBookInput = {
  title: 'Minimal Book',
  author: 'Another Author',
  genre: 'Non-Fiction',
  reading_status: 'To Read' // Need to provide since TypeScript requires it
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book with all fields', async () => {
    const result = await createBook(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Book');
    expect(result.author).toEqual('Test Author');
    expect(result.genre).toEqual('Fiction');
    expect(result.reading_status).toEqual('To Read');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a second book with different data', async () => {
    const result = await createBook(testInputMinimal);

    // Verify fields are correct
    expect(result.title).toEqual('Minimal Book');
    expect(result.author).toEqual('Another Author');
    expect(result.genre).toEqual('Non-Fiction');
    expect(result.reading_status).toEqual('To Read');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save book to database', async () => {
    const result = await createBook(testInput);

    // Query using proper drizzle syntax
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    expect(books[0].title).toEqual('Test Book');
    expect(books[0].author).toEqual('Test Author');
    expect(books[0].genre).toEqual('Fiction');
    expect(books[0].reading_status).toEqual('To Read');
    expect(books[0].created_at).toBeInstanceOf(Date);
    expect(books[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple books with unique IDs', async () => {
    const result1 = await createBook(testInput);
    const result2 = await createBook(testInputMinimal);

    // Verify unique IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toBeGreaterThan(0);
    expect(result2.id).toBeGreaterThan(0);

    // Verify both books exist in database
    const allBooks = await db.select()
      .from(booksTable)
      .execute();

    expect(allBooks).toHaveLength(2);
  });

  it('should handle different reading statuses correctly', async () => {
    const readingInput: CreateBookInput = {
      title: 'Currently Reading',
      author: 'Status Test',
      genre: 'Test Genre',
      reading_status: 'Reading'
    };

    const finishedInput: CreateBookInput = {
      title: 'Finished Book',
      author: 'Status Test',
      genre: 'Test Genre',
      reading_status: 'Finished'
    };

    const readingResult = await createBook(readingInput);
    const finishedResult = await createBook(finishedInput);

    expect(readingResult.reading_status).toEqual('Reading');
    expect(finishedResult.reading_status).toEqual('Finished');
  });
});
