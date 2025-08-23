import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Fiction',
  status: 'Read'
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
    expect(result.status).toEqual('Read');
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
    expect(books[0].status).toEqual('Read');
    expect(books[0].created_at).toBeInstanceOf(Date);
    expect(books[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create books with different statuses', async () => {
    const unreadBook: CreateBookInput = {
      title: 'To Read Book',
      author: 'Some Author',
      genre: 'Mystery',
      status: 'Unread'
    };

    const readingBook: CreateBookInput = {
      title: 'Currently Reading',
      author: 'Another Author',
      genre: 'Biography',
      status: 'Reading'
    };

    const unreadResult = await createBook(unreadBook);
    const readingResult = await createBook(readingBook);

    expect(unreadResult.status).toEqual('Unread');
    expect(readingResult.status).toEqual('Reading');
  });
});
