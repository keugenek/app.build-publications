import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

describe('deleteBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book', async () => {
    // First create a book to delete
    const result = await db.insert(booksTable)
      .values({
        title: 'Test Book',
        author: 'Test Author',
        genre: 'Test Genre',
        status: 'Unread'
      })
      .returning()
      .execute();
    
    const book = result[0];

    // Delete the book
    const input: DeleteBookInput = { id: book.id };
    const deleteResult = await deleteBook(input);

    // Verify deletion was successful
    expect(deleteResult).toBe(true);

    // Verify book no longer exists in database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, book.id))
      .execute();

    expect(books).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent book', async () => {
    const input: DeleteBookInput = { id: 99999 }; // Non-existent ID
    const result = await deleteBook(input);

    expect(result).toBe(false);
  });

  it('should properly handle database errors', async () => {
    // Test with extremely large ID that causes database error
    const input: DeleteBookInput = { id: Number.MAX_SAFE_INTEGER };
    
    // Should throw a database error
    await expect(deleteBook(input)).rejects.toThrow(/out of range for type integer/);
  });
});
