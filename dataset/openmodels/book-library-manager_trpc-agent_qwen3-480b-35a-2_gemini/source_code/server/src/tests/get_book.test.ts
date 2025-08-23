import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type GetBookInput } from '../schema';
import { getBook } from '../handlers/get_book';
import { eq } from 'drizzle-orm';

// Test input for creating a book
const createTestInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Test Genre',
  status: 'Unread'
};

// Test input for getting a book
const getTestInput: GetBookInput = {
  id: 1
};

describe('getBook', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test book first
    await db.insert(booksTable)
      .values(createTestInput)
      .execute();
  });
  
  afterEach(resetDB);

  it('should get a book by ID', async () => {
    const result = await getBook(getTestInput);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(1);
    expect(result?.title).toEqual('Test Book');
    expect(result?.author).toEqual('Test Author');
    expect(result?.genre).toEqual('Test Genre');
    expect(result?.status).toEqual('Unread');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent book', async () => {
    const input: GetBookInput = { id: 999 };
    const result = await getBook(input);
    
    expect(result).toBeNull();
  });

  it('should save book to database and retrieve it', async () => {
    // Create another book
    const newBook = await db.insert(booksTable)
      .values({
        title: 'Another Test Book',
        author: 'Another Test Author',
        genre: 'Another Test Genre',
        status: 'Read'
      })
      .returning()
      .execute();
    
    const bookId = newBook[0].id;
    
    // Retrieve the book using our handler
    const result = await getBook({ id: bookId });

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(bookId);
    expect(result?.title).toEqual('Another Test Book');
    expect(result?.author).toEqual('Another Test Author');
    expect(result?.genre).toEqual('Another Test Genre');
    expect(result?.status).toEqual('Read');
  });
});
