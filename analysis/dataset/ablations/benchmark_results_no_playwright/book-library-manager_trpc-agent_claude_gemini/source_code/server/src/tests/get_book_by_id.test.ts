import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { getBookById } from '../handlers/get_book_by_id';

// Test book data
const testBook: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Fiction',
  reading_status: 'Read'
};

const anotherTestBook: CreateBookInput = {
  title: 'To Kill a Mockingbird',
  author: 'Harper Lee',
  genre: 'Fiction',
  reading_status: 'Currently Reading'
};

describe('getBookById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a book when found', async () => {
    // Create test book in database
    const insertResult = await db.insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Fetch the book by ID
    const result = await getBookById(createdBook.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('The Great Gatsby');
    expect(result!.author).toEqual('F. Scott Fitzgerald');
    expect(result!.genre).toEqual('Fiction');
    expect(result!.reading_status).toEqual('Read');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when book does not exist', async () => {
    // Try to fetch a book with an ID that doesn't exist
    const result = await getBookById(999);

    expect(result).toBeNull();
  });

  it('should return the correct book when multiple books exist', async () => {
    // Create multiple books
    const firstBookResult = await db.insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const secondBookResult = await db.insert(booksTable)
      .values(anotherTestBook)
      .returning()
      .execute();

    const firstBook = firstBookResult[0];
    const secondBook = secondBookResult[0];

    // Fetch the first book
    const result1 = await getBookById(firstBook.id);
    expect(result1).not.toBeNull();
    expect(result1!.title).toEqual('The Great Gatsby');
    expect(result1!.author).toEqual('F. Scott Fitzgerald');

    // Fetch the second book
    const result2 = await getBookById(secondBook.id);
    expect(result2).not.toBeNull();
    expect(result2!.title).toEqual('To Kill a Mockingbird');
    expect(result2!.author).toEqual('Harper Lee');
    expect(result2!.reading_status).toEqual('Currently Reading');
  });

  it('should handle different reading statuses correctly', async () => {
    const bookWithWantToRead: CreateBookInput = {
      title: '1984',
      author: 'George Orwell',
      genre: 'Dystopian Fiction',
      reading_status: 'Want to Read'
    };

    // Create book with "Want to Read" status
    const insertResult = await db.insert(booksTable)
      .values(bookWithWantToRead)
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Fetch and verify the reading status
    const result = await getBookById(createdBook.id);
    expect(result).not.toBeNull();
    expect(result!.reading_status).toEqual('Want to Read');
    expect(result!.title).toEqual('1984');
    expect(result!.genre).toEqual('Dystopian Fiction');
  });

  it('should return proper date objects for timestamps', async () => {
    // Create test book
    const insertResult = await db.insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Fetch the book
    const result = await getBookById(createdBook.id);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify dates are reasonable (created recently)
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10000);
    expect(result!.created_at >= tenSecondsAgo).toBe(true);
    expect(result!.updated_at >= tenSecondsAgo).toBe(true);
  });
});
