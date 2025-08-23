import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type UpdateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Test data
const testBook: CreateBookInput = {
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Test Genre',
  status: 'to-read'
};

const updateData: UpdateBookInput = {
  id: 1,
  title: 'Updated Book Title',
  author: 'Updated Author',
  genre: 'Updated Genre',
  status: 'completed'
};

describe('updateBook', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test book first
    await db.insert(booksTable).values(testBook).execute();
  });
  
  afterEach(resetDB);

  it('should update a book', async () => {
    const result = await updateBook(updateData);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.title).toEqual('Updated Book Title');
    expect(result.author).toEqual('Updated Author');
    expect(result.genre).toEqual('Updated Genre');
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated book to database', async () => {
    await updateBook(updateData);

    // Query the updated book
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, 1))
      .execute();

    expect(books).toHaveLength(1);
    expect(books[0].title).toEqual('Updated Book Title');
    expect(books[0].author).toEqual('Updated Author');
    expect(books[0].genre).toEqual('Updated Genre');
    expect(books[0].status).toEqual('completed');
    expect(books[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw an error when updating a non-existent book', async () => {
    const invalidUpdate: UpdateBookInput = {
      id: 999,
      title: 'Non-existent book'
    };

    await expect(updateBook(invalidUpdate)).rejects.toThrow();
  });
});
