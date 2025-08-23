import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type UpdateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Helper function to create a book for testing
const createTestBook = async (overrides: Partial<CreateBookInput> = {}) => {
  const defaultInput: CreateBookInput = {
    title: 'Test Book',
    author: 'Test Author',
    genre: 'Test Genre',
    status: 'Unread'
  };
  
  const input: CreateBookInput = { ...defaultInput, ...overrides };
  
  // Insert book directly for testing purposes
  const result = await db.insert(booksTable)
    .values({
      title: input.title,
      author: input.author,
      genre: input.genre,
      status: input.status
    })
    .returning()
    .execute();
    
  return result[0];
};

describe('updateBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a book with all fields', async () => {
    // Create a test book
    const book = await createTestBook();
    
    // Update all fields
    const updateInput: UpdateBookInput = {
      id: book.id,
      title: 'Updated Title',
      author: 'Updated Author',
      genre: 'Updated Genre',
      status: 'Read'
    };
    
    const result = await updateBook(updateInput);
    
    // Validate response
    expect(result.id).toEqual(book.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.author).toEqual('Updated Author');
    expect(result.genre).toEqual('Updated Genre');
    expect(result.status).toEqual('Read');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(book.updated_at.getTime());
  });

  it('should update a book with partial fields', async () => {
    // Create a test book
    const book = await createTestBook({ title: 'Original Title', author: 'Original Author' });
    
    // Update only title
    const updateInput: UpdateBookInput = {
      id: book.id,
      title: 'Updated Title'
    };
    
    const result = await updateBook(updateInput);
    
    // Validate that only title changed
    expect(result.id).toEqual(book.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.author).toEqual('Original Author'); // Should remain unchanged
    expect(result.genre).toEqual(book.genre); // Should remain unchanged
    expect(result.status).toEqual(book.status); // Should remain unchanged
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(book.updated_at.getTime());
  });

  it('should save updated book to database', async () => {
    // Create a test book
    const book = await createTestBook();
    
    // Update the book
    const updateInput: UpdateBookInput = {
      id: book.id,
      status: 'Reading'
    };
    
    await updateBook(updateInput);
    
    // Query database to verify update
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, book.id))
      .execute();
      
    expect(books).toHaveLength(1);
    expect(books[0].status).toEqual('Reading');
    expect(books[0].updated_at.getTime()).toBeGreaterThanOrEqual(book.updated_at.getTime());
  });

  it('should throw an error when trying to update a non-existent book', async () => {
    const updateInput: UpdateBookInput = {
      id: 99999, // Non-existent ID
      title: 'Non-existent Book'
    };
    
    await expect(updateBook(updateInput)).rejects.toThrow(/not found/i);
  });
});
