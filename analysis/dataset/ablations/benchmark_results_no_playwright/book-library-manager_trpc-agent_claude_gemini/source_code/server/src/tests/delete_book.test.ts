import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Test book data for creating prerequisites
const testBook = {
  title: 'Test Book for Deletion',
  author: 'Test Author',
  genre: 'Fiction',
  reading_status: 'Want to Read' as const
};

describe('deleteBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book successfully', async () => {
    // Create a book to delete
    const insertResult = await db.insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const createdBook = insertResult[0];
    const deleteInput: DeleteBookInput = { id: createdBook.id };

    // Delete the book
    const result = await deleteBook(deleteInput);

    // Verify response
    expect(result.success).toBe(true);
    expect(result.message).toEqual(`Book with ID ${createdBook.id} has been deleted successfully`);

    // Verify book is actually deleted from database
    const deletedBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, createdBook.id))
      .execute();

    expect(deletedBooks).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent book', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteBookInput = { id: nonExistentId };

    // Attempt to delete non-existent book
    await expect(deleteBook(deleteInput))
      .rejects
      .toThrow(/Book with ID 99999 not found/i);
  });

  it('should not affect other books when deleting one book', async () => {
    // Create multiple books
    const book1Result = await db.insert(booksTable)
      .values({
        title: 'Book 1',
        author: 'Author 1',
        genre: 'Fiction',
        reading_status: 'Read' as const
      })
      .returning()
      .execute();

    const book2Result = await db.insert(booksTable)
      .values({
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Non-Fiction',
        reading_status: 'Currently Reading' as const
      })
      .returning()
      .execute();

    const book1 = book1Result[0];
    const book2 = book2Result[0];

    // Delete only the first book
    const deleteInput: DeleteBookInput = { id: book1.id };
    const result = await deleteBook(deleteInput);

    expect(result.success).toBe(true);

    // Verify first book is deleted
    const deletedBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, book1.id))
      .execute();

    expect(deletedBooks).toHaveLength(0);

    // Verify second book still exists
    const remainingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, book2.id))
      .execute();

    expect(remainingBooks).toHaveLength(1);
    expect(remainingBooks[0].title).toEqual('Book 2');
    expect(remainingBooks[0].author).toEqual('Author 2');
  });

  it('should handle deletion of books with different reading statuses', async () => {
    // Create books with different reading statuses
    const readBook = await db.insert(booksTable)
      .values({
        title: 'Read Book',
        author: 'Test Author',
        genre: 'Fiction',
        reading_status: 'Read' as const
      })
      .returning()
      .execute();

    const currentlyReadingBook = await db.insert(booksTable)
      .values({
        title: 'Currently Reading Book',
        author: 'Test Author',
        genre: 'Non-Fiction',
        reading_status: 'Currently Reading' as const
      })
      .returning()
      .execute();

    // Delete the "Read" book
    const deleteInput1: DeleteBookInput = { id: readBook[0].id };
    const result1 = await deleteBook(deleteInput1);

    expect(result1.success).toBe(true);

    // Delete the "Currently Reading" book
    const deleteInput2: DeleteBookInput = { id: currentlyReadingBook[0].id };
    const result2 = await deleteBook(deleteInput2);

    expect(result2.success).toBe(true);

    // Verify both books are deleted
    const allBooks = await db.select().from(booksTable).execute();
    expect(allBooks).toHaveLength(0);
  });

  it('should handle edge case with ID 0', async () => {
    const deleteInput: DeleteBookInput = { id: 0 };

    // Attempt to delete book with ID 0
    await expect(deleteBook(deleteInput))
      .rejects
      .toThrow(/Book with ID 0 not found/i);
  });
});
