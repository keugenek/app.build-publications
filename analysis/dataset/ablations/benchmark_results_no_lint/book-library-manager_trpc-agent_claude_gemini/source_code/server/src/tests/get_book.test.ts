import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBookInput, type CreateBookInput } from '../schema';
import { getBook } from '../handlers/get_book';
import { eq } from 'drizzle-orm';

// Test input for getting a book
const testGetInput: GetBookInput = {
  id: 1
};

// Test input for creating a book
const testCreateInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Fiction',
  reading_status: 'To Read'
};

describe('getBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a book when it exists', async () => {
    // First, create a book in the database
    const createResult = await db.insert(booksTable)
      .values({
        title: testCreateInput.title,
        author: testCreateInput.author,
        genre: testCreateInput.genre,
        reading_status: testCreateInput.reading_status
      })
      .returning()
      .execute();

    const createdBook = createResult[0];

    // Now retrieve the book using the handler
    const result = await getBook({ id: createdBook.id });

    // Verify the book was retrieved successfully
    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdBook.id);
    expect(result?.title).toEqual('Test Book');
    expect(result?.author).toEqual('Test Author');
    expect(result?.genre).toEqual('Fiction');
    expect(result?.reading_status).toEqual('To Read');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when book does not exist', async () => {
    // Try to get a book with an ID that doesn't exist
    const result = await getBook({ id: 999 });

    // Should return null for non-existent book
    expect(result).toBeNull();
  });

  it('should retrieve book with different reading statuses correctly', async () => {
    // Create books with different reading statuses
    const readingBook = await db.insert(booksTable)
      .values({
        title: 'Currently Reading',
        author: 'Author Two',
        genre: 'Non-Fiction',
        reading_status: 'Reading'
      })
      .returning()
      .execute();

    const finishedBook = await db.insert(booksTable)
      .values({
        title: 'Finished Book',
        author: 'Author Three',
        genre: 'Mystery',
        reading_status: 'Finished'
      })
      .returning()
      .execute();

    // Test retrieval of book with 'Reading' status
    const readingResult = await getBook({ id: readingBook[0].id });
    expect(readingResult?.reading_status).toEqual('Reading');
    expect(readingResult?.title).toEqual('Currently Reading');

    // Test retrieval of book with 'Finished' status
    const finishedResult = await getBook({ id: finishedBook[0].id });
    expect(finishedResult?.reading_status).toEqual('Finished');
    expect(finishedResult?.title).toEqual('Finished Book');
  });

  it('should verify database state remains unchanged after retrieval', async () => {
    // Create a book
    const createResult = await db.insert(booksTable)
      .values({
        title: 'Database Test Book',
        author: 'DB Author',
        genre: 'Technical',
        reading_status: 'To Read'
      })
      .returning()
      .execute();

    const bookId = createResult[0].id;

    // Retrieve the book using the handler
    await getBook({ id: bookId });

    // Verify the book still exists in the database unchanged
    const dbBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(dbBooks).toHaveLength(1);
    expect(dbBooks[0].title).toEqual('Database Test Book');
    expect(dbBooks[0].author).toEqual('DB Author');
    expect(dbBooks[0].genre).toEqual('Technical');
    expect(dbBooks[0].reading_status).toEqual('To Read');
  });

  it('should handle date fields correctly', async () => {
    // Create a book
    const createResult = await db.insert(booksTable)
      .values({
        title: 'Date Test Book',
        author: 'Date Author',
        genre: 'Science',
        reading_status: 'Reading'
      })
      .returning()
      .execute();

    const bookId = createResult[0].id;

    // Retrieve the book
    const result = await getBook({ id: bookId });

    // Verify date fields are proper Date objects
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
    
    // Verify dates are reasonable (within the last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.created_at! >= oneMinuteAgo).toBe(true);
    expect(result?.created_at! <= now).toBe(true);
    
    expect(result?.updated_at).toBeInstanceOf(Date);
    expect(result?.updated_at! >= oneMinuteAgo).toBe(true);
    expect(result?.updated_at! <= now).toBe(true);
  });
});
