import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput, type CreateBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Test input for creating books to delete
const testBookInput: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Fiction',
  reading_status: 'To Read'
};

const anotherBookInput: CreateBookInput = {
  title: 'Another Book',
  author: 'Another Author',
  genre: 'Mystery',
  reading_status: 'Reading'
};

describe('deleteBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book and return true', async () => {
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
    const deleteInput: DeleteBookInput = { id: bookId };

    // Delete the book
    const result = await deleteBook(deleteInput);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the book is actually deleted from database
    const remainingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(remainingBooks).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent book', async () => {
    const nonExistentId = 999;
    const deleteInput: DeleteBookInput = { id: nonExistentId };

    // Try to delete non-existent book
    const result = await deleteBook(deleteInput);

    // Should return false indicating no book was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified book, not others', async () => {
    // Create two books
    const firstBookResult = await db.insert(booksTable)
      .values({
        title: testBookInput.title,
        author: testBookInput.author,
        genre: testBookInput.genre,
        reading_status: testBookInput.reading_status
      })
      .returning()
      .execute();

    const secondBookResult = await db.insert(booksTable)
      .values({
        title: anotherBookInput.title,
        author: anotherBookInput.author,
        genre: anotherBookInput.genre,
        reading_status: anotherBookInput.reading_status
      })
      .returning()
      .execute();

    const firstBookId = firstBookResult[0].id;
    const secondBookId = secondBookResult[0].id;

    // Delete only the first book
    const deleteInput: DeleteBookInput = { id: firstBookId };
    const result = await deleteBook(deleteInput);

    expect(result).toBe(true);

    // Verify first book is deleted
    const deletedBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, firstBookId))
      .execute();

    expect(deletedBook).toHaveLength(0);

    // Verify second book still exists
    const remainingBook = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, secondBookId))
      .execute();

    expect(remainingBook).toHaveLength(1);
    expect(remainingBook[0].title).toEqual(anotherBookInput.title);
    expect(remainingBook[0].author).toEqual(anotherBookInput.author);
  });

  it('should handle deletion of books with different reading statuses', async () => {
    // Create books with different reading statuses
    const toReadBook = await db.insert(booksTable)
      .values({
        title: 'To Read Book',
        author: 'Author 1',
        genre: 'Fiction',
        reading_status: 'To Read'
      })
      .returning()
      .execute();

    const readingBook = await db.insert(booksTable)
      .values({
        title: 'Currently Reading Book',
        author: 'Author 2',
        genre: 'Non-fiction',
        reading_status: 'Reading'
      })
      .returning()
      .execute();

    const finishedBook = await db.insert(booksTable)
      .values({
        title: 'Finished Book',
        author: 'Author 3',
        genre: 'Biography',
        reading_status: 'Finished'
      })
      .returning()
      .execute();

    // Delete each book and verify successful deletion
    const results = await Promise.all([
      deleteBook({ id: toReadBook[0].id }),
      deleteBook({ id: readingBook[0].id }),
      deleteBook({ id: finishedBook[0].id })
    ]);

    // All deletions should succeed
    results.forEach(result => {
      expect(result).toBe(true);
    });

    // Verify all books are deleted
    const allBooks = await db.select().from(booksTable).execute();
    expect(allBooks).toHaveLength(0);
  });
});
