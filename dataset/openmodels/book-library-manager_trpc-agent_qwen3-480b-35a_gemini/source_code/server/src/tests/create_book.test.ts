import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Fiction',
  status: 'to_read'
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book', async () => {
    const result = await createBook(testInput);

    // Basic field validation
    expect(result.title).toEqual('The Great Gatsby');
    expect(result.author).toEqual('F. Scott Fitzgerald');
    expect(result.genre).toEqual('Fiction');
    expect(result.status).toEqual('to_read');
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
    expect(books[0].title).toEqual('The Great Gatsby');
    expect(books[0].author).toEqual('F. Scott Fitzgerald');
    expect(books[0].genre).toEqual('Fiction');
    expect(books[0].status).toEqual('to_read');
    expect(books[0].created_at).toBeInstanceOf(Date);
    expect(books[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable genre field', async () => {
    const inputWithoutGenre: CreateBookInput = {
      title: 'Moby Dick',
      author: 'Herman Melville',
      genre: null,
      status: 'reading'
    };

    const result = await createBook(inputWithoutGenre);

    expect(result.genre).toBeNull();

    // Verify in database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    expect(books[0].genre).toBeNull();
  });

  it('should test all book status values', async () => {
    const statuses: ('to_read' | 'reading' | 'completed')[] = ['to_read', 'reading', 'completed'];
    
    for (const status of statuses) {
      const input: CreateBookInput = {
        title: `Book with status ${status}`,
        author: 'Test Author',
        genre: 'Test Genre',
        status
      };

      const result = await createBook(input);
      expect(result.status).toEqual(status);
    }
  });
});
