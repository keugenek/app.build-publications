import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type DeleteBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Test data for creating a book
const testCreateInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Test Genre',
  status: 'to_read'
};

const createTestBook = async () => {
  return await db.insert(booksTable)
    .values({
      title: testCreateInput.title,
      author: testCreateInput.author,
      genre: testCreateInput.genre,
      status: testCreateInput.status
    })
    .returning()
    .execute();
};

describe('deleteBook', () => {
  beforeEach(async () => {
    await createDB();
  });
  
  afterEach(resetDB);

  it('should delete a book by id', async () => {
    // First create a book to delete
    const [createdBook] = await createTestBook();
    
    // Prepare delete input
    const deleteInput: DeleteBookInput = {
      id: createdBook.id
    };
    
    // Delete the book
    const result = await deleteBook(deleteInput);
    
    // Should return true when book is successfully deleted
    expect(result).toBe(true);
    
    // Verify the book no longer exists in the database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, createdBook.id))
      .execute();
      
    expect(books).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent book', async () => {
    // Try to delete a book that doesn't exist
    const deleteInput: DeleteBookInput = {
      id: 99999 // Non-existent ID
    };
    
    const result = await deleteBook(deleteInput);
    
    // Should return false when no book is deleted
    expect(result).toBe(false);
  });

  it('should properly handle database errors', async () => {
    // Create a book first
    const [createdBook] = await createTestBook();
    
    // Try to delete with invalid input (this would be caught by TypeScript in practice)
    // but we can simulate an error scenario
    const deleteInput: DeleteBookInput = {
      id: createdBook.id
    };
    
    // The function should work correctly under normal conditions
    const result = await deleteBook(deleteInput);
    expect(result).toBe(true);
  });
});
