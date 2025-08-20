import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBookInput } from '../schema';
import { getBook } from '../handlers/get_book';
import { eq } from 'drizzle-orm';

// Test data
const testBookData = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Fiction',
  reading_status: 'Reading' as const
};

const anotherBookData = {
  title: '1984',
  author: 'George Orwell',
  genre: 'Dystopian Fiction',
  reading_status: 'Finished' as const
};

describe('getBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a book when found by ID', async () => {
    // Create a book first
    const insertResult = await db.insert(booksTable)
      .values(testBookData)
      .returning()
      .execute();

    const createdBook = insertResult[0];
    const input: GetBookInput = { id: createdBook.id };

    // Get the book
    const result = await getBook(input);

    // Verify the book was returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('The Great Gatsby');
    expect(result!.author).toEqual('F. Scott Fitzgerald');
    expect(result!.genre).toEqual('Fiction');
    expect(result!.reading_status).toEqual('Reading');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when book is not found', async () => {
    const input: GetBookInput = { id: 999 }; // Non-existent ID

    const result = await getBook(input);

    expect(result).toBeNull();
  });

  it('should return the correct book when multiple books exist', async () => {
    // Create multiple books
    const insertResult1 = await db.insert(booksTable)
      .values(testBookData)
      .returning()
      .execute();

    const insertResult2 = await db.insert(booksTable)
      .values(anotherBookData)
      .returning()
      .execute();

    const book1 = insertResult1[0];
    const book2 = insertResult2[0];

    // Get the second book specifically
    const input: GetBookInput = { id: book2.id };
    const result = await getBook(input);

    // Verify we got the correct book
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(book2.id);
    expect(result!.title).toEqual('1984');
    expect(result!.author).toEqual('George Orwell');
    expect(result!.genre).toEqual('Dystopian Fiction');
    expect(result!.reading_status).toEqual('Finished');

    // Verify it's not the first book
    expect(result!.id).not.toEqual(book1.id);
    expect(result!.title).not.toEqual('The Great Gatsby');
  });

  it('should handle different reading statuses correctly', async () => {
    // Create books with different reading statuses
    const toReadBook = await db.insert(booksTable)
      .values({
        title: 'Future Read',
        author: 'Future Author',
        genre: 'Science Fiction',
        reading_status: 'To Read'
      })
      .returning()
      .execute();

    const readingBook = await db.insert(booksTable)
      .values({
        title: 'Current Read',
        author: 'Current Author', 
        genre: 'Fantasy',
        reading_status: 'Reading'
      })
      .returning()
      .execute();

    const finishedBook = await db.insert(booksTable)
      .values({
        title: 'Completed Read',
        author: 'Completed Author',
        genre: 'Mystery',
        reading_status: 'Finished'
      })
      .returning()
      .execute();

    // Test each reading status
    const toReadResult = await getBook({ id: toReadBook[0].id });
    expect(toReadResult!.reading_status).toEqual('To Read');

    const readingResult = await getBook({ id: readingBook[0].id });
    expect(readingResult!.reading_status).toEqual('Reading');

    const finishedResult = await getBook({ id: finishedBook[0].id });
    expect(finishedResult!.reading_status).toEqual('Finished');
  });

  it('should verify database consistency after retrieval', async () => {
    // Create a book
    const insertResult = await db.insert(booksTable)
      .values(testBookData)
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Get the book through the handler
    const handlerResult = await getBook({ id: createdBook.id });

    // Verify the data matches what's actually in the database
    const directResult = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, createdBook.id))
      .execute();

    expect(handlerResult).toEqual(directResult[0]);
    expect(handlerResult!.created_at).toEqual(directResult[0].created_at);
    expect(handlerResult!.updated_at).toEqual(directResult[0].updated_at);
  });
});
