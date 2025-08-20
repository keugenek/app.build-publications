import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type DeleteBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Test input for creating a book to delete
const testBookInput: CreateBookInput = {
  title: 'Test Book to Delete',
  author: 'Test Author',
  genre: 'Test Genre',
  reading_status: 'To Read'
};

// Test input for deleting a book
const deleteInput: DeleteBookInput = {
  id: 1
};

describe('deleteBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book and return success true', async () => {
    // First create a book to delete
    const insertResult = await db.insert(booksTable)
      .values({
        title: testBookInput.title,
        author: testBookInput.author,
        genre: testBookInput.genre,
        reading_status: testBookInput.reading_status
      })
      .returning()
      .execute();

    const bookId = insertResult[0].id;

    // Now delete the book
    const result = await deleteBook({ id: bookId });

    // Should return success: true
    expect(result.success).toBe(true);
  });

  it('should remove book from database when deleted successfully', async () => {
    // First create a book to delete
    const insertResult = await db.insert(booksTable)
      .values({
        title: testBookInput.title,
        author: testBookInput.author,
        genre: testBookInput.genre,
        reading_status: testBookInput.reading_status
      })
      .returning()
      .execute();

    const bookId = insertResult[0].id;

    // Delete the book
    await deleteBook({ id: bookId });

    // Verify book is no longer in database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(books).toHaveLength(0);
  });

  it('should return success false when book does not exist', async () => {
    // Try to delete a book with non-existent ID
    const result = await deleteBook({ id: 999 });

    // Should return success: false
    expect(result.success).toBe(false);
  });

  it('should not affect other books when deleting one book', async () => {
    // Create two books
    const insertResult1 = await db.insert(booksTable)
      .values({
        title: 'Book One',
        author: 'Author One',
        genre: 'Genre One',
        reading_status: 'To Read'
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(booksTable)
      .values({
        title: 'Book Two',
        author: 'Author Two',
        genre: 'Genre Two',
        reading_status: 'Reading'
      })
      .returning()
      .execute();

    const bookId1 = insertResult1[0].id;
    const bookId2 = insertResult2[0].id;

    // Delete only the first book
    const result = await deleteBook({ id: bookId1 });

    expect(result.success).toBe(true);

    // Verify first book is deleted
    const deletedBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId1))
      .execute();

    expect(deletedBooks).toHaveLength(0);

    // Verify second book still exists
    const remainingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId2))
      .execute();

    expect(remainingBooks).toHaveLength(1);
    expect(remainingBooks[0].title).toEqual('Book Two');
  });

  it('should handle edge case of deleting same book ID twice', async () => {
    // First create a book
    const insertResult = await db.insert(booksTable)
      .values({
        title: testBookInput.title,
        author: testBookInput.author,
        genre: testBookInput.genre,
        reading_status: testBookInput.reading_status
      })
      .returning()
      .execute();

    const bookId = insertResult[0].id;

    // Delete the book first time
    const firstResult = await deleteBook({ id: bookId });
    expect(firstResult.success).toBe(true);

    // Try to delete the same book again
    const secondResult = await deleteBook({ id: bookId });
    expect(secondResult.success).toBe(false);
  });
});
