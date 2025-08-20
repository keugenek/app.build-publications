import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

describe('updateBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test book
  const createTestBook = async () => {
    const result = await db.insert(booksTable)
      .values({
        title: 'Original Title',
        author: 'Original Author',
        genre: 'Fiction',
        reading_status: 'Want to Read'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update a book with all fields', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Updated Title',
      author: 'Updated Author',
      genre: 'Non-Fiction',
      reading_status: 'Read'
    };

    const result = await updateBook(updateInput);

    expect(result.id).toEqual(testBook.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.author).toEqual('Updated Author');
    expect(result.genre).toEqual('Non-Fiction');
    expect(result.reading_status).toEqual('Read');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testBook.updated_at.getTime());
  });

  it('should update only specific fields', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Partially Updated Title',
      reading_status: 'Currently Reading'
    };

    const result = await updateBook(updateInput);

    expect(result.id).toEqual(testBook.id);
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.author).toEqual('Original Author'); // Should remain unchanged
    expect(result.genre).toEqual('Fiction'); // Should remain unchanged
    expect(result.reading_status).toEqual('Currently Reading');
    expect(result.updated_at.getTime()).toBeGreaterThan(testBook.updated_at.getTime());
  });

  it('should update only reading status', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      reading_status: 'Read'
    };

    const result = await updateBook(updateInput);

    expect(result.id).toEqual(testBook.id);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.author).toEqual('Original Author'); // Should remain unchanged
    expect(result.genre).toEqual('Fiction'); // Should remain unchanged
    expect(result.reading_status).toEqual('Read');
    expect(result.updated_at.getTime()).toBeGreaterThan(testBook.updated_at.getTime());
  });

  it('should persist changes to database', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Database Updated Title',
      author: 'Database Updated Author'
    };

    await updateBook(updateInput);

    // Verify the changes are persisted in the database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, testBook.id))
      .execute();

    expect(books).toHaveLength(1);
    expect(books[0].title).toEqual('Database Updated Title');
    expect(books[0].author).toEqual('Database Updated Author');
    expect(books[0].genre).toEqual('Fiction'); // Should remain unchanged
    expect(books[0].reading_status).toEqual('Want to Read'); // Should remain unchanged
    expect(books[0].updated_at).toBeInstanceOf(Date);
    expect(books[0].updated_at.getTime()).toBeGreaterThan(testBook.updated_at.getTime());
  });

  it('should throw error when book does not exist', async () => {
    const updateInput: UpdateBookInput = {
      id: 999999, // Non-existent ID
      title: 'This Should Fail'
    };

    await expect(updateBook(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    const testBook = await createTestBook();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateBookInput = {
      id: testBook.id
    };

    const result = await updateBook(updateInput);

    expect(result.id).toEqual(testBook.id);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.author).toEqual('Original Author'); // Should remain unchanged
    expect(result.genre).toEqual('Fiction'); // Should remain unchanged
    expect(result.reading_status).toEqual('Want to Read'); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(testBook.updated_at.getTime());
  });

  it('should handle all reading status values', async () => {
    const testBook = await createTestBook();
    
    // Test updating to each possible reading status
    const statuses = ['Read', 'Currently Reading', 'Want to Read'] as const;
    
    for (const status of statuses) {
      const updateInput: UpdateBookInput = {
        id: testBook.id,
        reading_status: status
      };

      const result = await updateBook(updateInput);
      expect(result.reading_status).toEqual(status);
    }
  });
});
