import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type CreateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Test book data for creation
const testBookData: CreateBookInput = {
  title: 'Original Title',
  author: 'Original Author',
  genre: 'Fiction',
  reading_status: 'To Read'
};

describe('updateBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test book
  const createTestBook = async () => {
    const result = await db.insert(booksTable)
      .values(testBookData)
      .returning()
      .execute();
    return result[0];
  };

  it('should update a single field', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id,
      title: 'Updated Title'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.author).toEqual('Original Author'); // Should remain unchanged
    expect(result!.genre).toEqual('Fiction'); // Should remain unchanged
    expect(result!.reading_status).toEqual('To Read'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdBook.updated_at).toBe(true);
  });

  it('should update multiple fields', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id,
      title: 'New Title',
      author: 'New Author',
      reading_status: 'Reading'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('New Title');
    expect(result!.author).toEqual('New Author');
    expect(result!.genre).toEqual('Fiction'); // Should remain unchanged
    expect(result!.reading_status).toEqual('Reading');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdBook.updated_at).toBe(true);
  });

  it('should update all optional fields', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id,
      title: 'Completely New Title',
      author: 'Completely New Author',
      genre: 'Mystery',
      reading_status: 'Finished'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('Completely New Title');
    expect(result!.author).toEqual('Completely New Author');
    expect(result!.genre).toEqual('Mystery');
    expect(result!.reading_status).toEqual('Finished');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdBook.updated_at).toBe(true);
  });

  it('should update reading status correctly', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id,
      reading_status: 'Finished'
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.reading_status).toEqual('Finished');
    expect(result!.title).toEqual('Original Title'); // Other fields unchanged
  });

  it('should persist changes to database', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id,
      title: 'Persisted Title',
      genre: 'Non-Fiction'
    };

    await updateBook(updateInput);

    // Query database directly to verify persistence
    const booksFromDb = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, createdBook.id))
      .execute();

    expect(booksFromDb).toHaveLength(1);
    expect(booksFromDb[0].title).toEqual('Persisted Title');
    expect(booksFromDb[0].genre).toEqual('Non-Fiction');
    expect(booksFromDb[0].author).toEqual('Original Author'); // Unchanged
    expect(booksFromDb[0].updated_at).toBeInstanceOf(Date);
    expect(booksFromDb[0].updated_at > createdBook.updated_at).toBe(true);
  });

  it('should return null when book does not exist', async () => {
    const updateInput: UpdateBookInput = {
      id: 999999, // Non-existent ID
      title: 'This Should Not Work'
    };

    const result = await updateBook(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id
      // No fields to update
    };

    const result = await updateBook(updateInput);

    expect(result).toBeNull();
  });

  it('should handle updating to same values', async () => {
    // Create test book
    const createdBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: createdBook.id,
      title: 'Original Title', // Same as original
      reading_status: 'To Read' // Same as original
    };

    const result = await updateBook(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Original Title');
    expect(result!.reading_status).toEqual('To Read');
    // updated_at should still be updated even if values are the same
    expect(result!.updated_at > createdBook.updated_at).toBe(true);
  });
});
