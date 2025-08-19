import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type DeleteBookInput, type CreateBookInput } from '../schema';
import { deleteBook } from '../handlers/delete_book';
import { eq } from 'drizzle-orm';

// Test input for creating a book to delete
const testBookInput: CreateBookInput = {
  title: 'Test Book to Delete',
  author: 'Test Author',
  genre: 'Test Genre',
  reading_status: 'To Read',
  isbn: '978-0123456789',
  pages: 250,
  publication_year: 2023,
  notes: 'Test notes for deletion'
};

describe('deleteBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing book successfully', async () => {
    // First, create a book to delete
    const createdBook = await db.insert(booksTable)
      .values({
        title: testBookInput.title,
        author: testBookInput.author,
        genre: testBookInput.genre,
        reading_status: testBookInput.reading_status,
        isbn: testBookInput.isbn,
        pages: testBookInput.pages,
        publication_year: testBookInput.publication_year,
        notes: testBookInput.notes
      })
      .returning()
      .execute();

    const bookId = createdBook[0].id;

    // Delete the book
    const deleteInput: DeleteBookInput = { id: bookId };
    const result = await deleteBook(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify the book no longer exists in the database
    const deletedBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(deletedBooks).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent book', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteBookInput = { id: nonExistentId };

    await expect(deleteBook(deleteInput)).rejects.toThrow(/Book with ID 99999 not found/i);
  });

  it('should not affect other books when deleting one book', async () => {
    // Create two books
    const book1 = await db.insert(booksTable)
      .values({
        title: 'Book One',
        author: 'Author One',
        genre: 'Fiction',
        reading_status: 'To Read'
      })
      .returning()
      .execute();

    const book2 = await db.insert(booksTable)
      .values({
        title: 'Book Two',
        author: 'Author Two',
        genre: 'Non-Fiction',
        reading_status: 'Reading'
      })
      .returning()
      .execute();

    const book1Id = book1[0].id;
    const book2Id = book2[0].id;

    // Delete only the first book
    const deleteInput: DeleteBookInput = { id: book1Id };
    const result = await deleteBook(deleteInput);

    expect(result.success).toBe(true);

    // Verify first book is deleted
    const deletedBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, book1Id))
      .execute();

    expect(deletedBooks).toHaveLength(0);

    // Verify second book still exists
    const remainingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, book2Id))
      .execute();

    expect(remainingBooks).toHaveLength(1);
    expect(remainingBooks[0].title).toEqual('Book Two');
    expect(remainingBooks[0].author).toEqual('Author Two');
  });

  it('should handle deletion of book with minimal data', async () => {
    // Create a book with only required fields
    const minimalBook = await db.insert(booksTable)
      .values({
        title: 'Minimal Book',
        author: 'Minimal Author',
        genre: 'Minimal Genre',
        reading_status: 'Finished'
      })
      .returning()
      .execute();

    const bookId = minimalBook[0].id;

    // Delete the minimal book
    const deleteInput: DeleteBookInput = { id: bookId };
    const result = await deleteBook(deleteInput);

    expect(result.success).toBe(true);

    // Verify deletion
    const deletedBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(deletedBooks).toHaveLength(0);
  });

  it('should verify book count decreases after deletion', async () => {
    // Get initial count
    const initialBooks = await db.select().from(booksTable).execute();
    const initialCount = initialBooks.length;

    // Create a book
    const createdBook = await db.insert(booksTable)
      .values({
        title: 'Count Test Book',
        author: 'Count Test Author',
        genre: 'Test',
        reading_status: 'To Read'
      })
      .returning()
      .execute();

    const bookId = createdBook[0].id;

    // Verify count increased
    const afterCreateBooks = await db.select().from(booksTable).execute();
    expect(afterCreateBooks.length).toBe(initialCount + 1);

    // Delete the book
    const deleteInput: DeleteBookInput = { id: bookId };
    await deleteBook(deleteInput);

    // Verify count returned to initial value
    const finalBooks = await db.select().from(booksTable).execute();
    expect(finalBooks.length).toBe(initialCount);
  });
});
