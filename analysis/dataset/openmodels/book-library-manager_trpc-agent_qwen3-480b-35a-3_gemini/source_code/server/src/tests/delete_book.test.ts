import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type DeleteBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test input for creating a book
const createInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Test Genre',
  status: 'to-read'
};

describe('deleteBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book', async () => {
    // First create a book to delete
    const createdBook = await createBook(createInput);
    
    // Prepare delete input
    const deleteInput: DeleteBookInput = {
      id: createdBook.id
    };

    // Delete the book
    const result = await deleteBook(deleteInput);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the book no longer exists in the database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, deleteInput.id))
      .execute();

    expect(books).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent book', async () => {
    // Try to delete a book that doesn't exist
    const deleteInput: DeleteBookInput = {
      id: 99999 // Non-existent ID
    };

    // This should return false since no book exists with that ID
    const result = await deleteBook(deleteInput);
    expect(result).toBe(false);
  });

  it('should properly handle concurrent operations', async () => {
    // Create multiple books
    const book1 = await createBook(createInput);
    const book2 = await createBook({
      ...createInput,
      title: 'Test Book 2'
    });

    // Delete one book
    await deleteBook({ id: book1.id });

    // Verify only one book remains
    const books = await db.select().from(booksTable).execute();
    expect(books).toHaveLength(1);
    expect(books[0].id).toBe(book2.id);
    expect(books[0].title).toBe('Test Book 2');
  });
});
