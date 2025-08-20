import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type CreateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Helper function to create a test book
const createTestBook = async (): Promise<number> => {
  const testBookData: CreateBookInput = {
    title: 'Original Title',
    author: 'Original Author',
    genre: 'Fiction',
    reading_status: 'To Read'
  };

  const result = await db.insert(booksTable)
    .values(testBookData)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a book', async () => {
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Updated Title',
      author: 'Updated Author',
      genre: 'Non-Fiction',
      reading_status: 'Reading'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(bookId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.author).toEqual('Updated Author');
    expect(result!.genre).toEqual('Non-Fiction');
    expect(result!.reading_status).toEqual('Reading');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only the title field', async () => {
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Only Title Updated'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Only Title Updated');
    expect(result!.author).toEqual('Original Author'); // Should remain unchanged
    expect(result!.genre).toEqual('Fiction'); // Should remain unchanged
    expect(result!.reading_status).toEqual('To Read'); // Should remain unchanged
  });

  it('should update only the reading status', async () => {
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      reading_status: 'Finished'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.reading_status).toEqual('Finished');
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.author).toEqual('Original Author'); // Should remain unchanged
    expect(result!.genre).toEqual('Fiction'); // Should remain unchanged
  });

  it('should update multiple fields but not all', async () => {
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      author: 'New Author',
      genre: 'Mystery'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.author).toEqual('New Author');
    expect(result!.genre).toEqual('Mystery');
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.reading_status).toEqual('To Read'); // Should remain unchanged
  });

  it('should always update the updated_at timestamp', async () => {
    const bookId = await createTestBook();

    // Get the original timestamp
    const originalBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    const originalTimestamp = originalBook[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Updated Title'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should return null for non-existent book', async () => {
    const updateInput: UpdateBookInput = {
      id: 99999, // Non-existent ID
      title: 'This should not work'
    };

    const result = await updateBook(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes in the database', async () => {
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Persisted Title',
      reading_status: 'Reading'
    };

    await updateBook(updateInput);

    // Query the database directly to verify changes were persisted
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(books).toHaveLength(1);
    expect(books[0].title).toEqual('Persisted Title');
    expect(books[0].reading_status).toEqual('Reading');
    expect(books[0].author).toEqual('Original Author'); // Should remain unchanged
    expect(books[0].genre).toEqual('Fiction'); // Should remain unchanged
  });

  it('should handle all valid reading status values', async () => {
    const bookId = await createTestBook();

    // Test 'Reading' status
    let updateInput: UpdateBookInput = {
      id: bookId,
      reading_status: 'Reading'
    };

    let result = await updateBook(updateInput);
    expect(result!.reading_status).toEqual('Reading');

    // Test 'Finished' status
    updateInput = {
      id: bookId,
      reading_status: 'Finished'
    };

    result = await updateBook(updateInput);
    expect(result!.reading_status).toEqual('Finished');

    // Test 'To Read' status
    updateInput = {
      id: bookId,
      reading_status: 'To Read'
    };

    result = await updateBook(updateInput);
    expect(result!.reading_status).toEqual('To Read');
  });

  it('should preserve created_at timestamp during update', async () => {
    const bookId = await createTestBook();

    // Get the original created_at timestamp
    const originalBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    const originalCreatedAt = originalBook[0].created_at;

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Updated Title'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.created_at.getTime()).toEqual(originalCreatedAt.getTime());
  });
});
