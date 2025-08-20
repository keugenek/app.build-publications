import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Test data for updating a book
const updateInput: UpdateBookInput = {
  id: 1,
  title: 'Updated Book Title',
  author: 'Updated Author',
  genre: 'Updated Genre',
  status: 'reading'
};

describe('updateBook', () => {
  beforeEach(async () => {
    await createDB();
    // Create a book to update
    await db.insert(booksTable).values({
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Test Genre',
      status: 'to_read'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update a book', async () => {
    const result = await updateBook(updateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.title).toEqual('Updated Book Title');
    expect(result.author).toEqual('Updated Author');
    expect(result.genre).toEqual('Updated Genre');
    expect(result.status).toEqual('reading');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated book to database', async () => {
    const result = await updateBook(updateInput);

    // Query the updated book from database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    const book = books[0];
    expect(book.id).toEqual(1);
    expect(book.title).toEqual('Updated Book Title');
    expect(book.author).toEqual('Updated Author');
    expect(book.genre).toEqual('Updated Genre');
    expect(book.status).toEqual('reading');
    expect(book.created_at).toBeInstanceOf(Date);
    expect(book.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // First, get the original book
    const originalBooks = await db.select().from(booksTable).execute();
    const originalBook = originalBooks[0] as unknown as Book;
    
    // Update only the title
    const partialUpdate: UpdateBookInput = {
      id: 1,
      title: 'Partially Updated Title'
    };
    
    const result = await updateBook(partialUpdate);

    // Check that only the title was updated
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.author).toEqual(originalBook.author);
    expect(result.genre).toEqual(originalBook.genre);
    expect(result.status).toEqual(originalBook.status);
    
    // Verify in database
    const books = await db.select().from(booksTable).where(eq(booksTable.id, 1)).execute();
    expect(books).toHaveLength(1);
    const book = books[0];
    expect(book.title).toEqual('Partially Updated Title');
    expect(book.author).toEqual(originalBook.author);
    expect(book.genre).toEqual(originalBook.genre);
    expect(book.status).toEqual(originalBook.status);
  });

  it('should throw an error when updating a non-existent book', async () => {
    const invalidUpdate: UpdateBookInput = {
      id: 999,
      title: 'Non-existent Book'
    };

    await expect(updateBook(invalidUpdate)).rejects.toThrow(/not found/);
  });
});
