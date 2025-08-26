import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test inputs covering all reading statuses
const testInputToRead: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Classic Fiction',
  reading_status: 'To Read'
};

const testInputReading: CreateBookInput = {
  title: '1984',
  author: 'George Orwell',
  genre: 'Dystopian Fiction',
  reading_status: 'Reading'
};

const testInputFinished: CreateBookInput = {
  title: 'To Kill a Mockingbird',
  author: 'Harper Lee',
  genre: 'Classic Literature',
  reading_status: 'Finished'
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book with "To Read" status', async () => {
    const result = await createBook(testInputToRead);

    // Basic field validation
    expect(result.title).toEqual('The Great Gatsby');
    expect(result.author).toEqual('F. Scott Fitzgerald');
    expect(result.genre).toEqual('Classic Fiction');
    expect(result.reading_status).toEqual('To Read');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a book with "Reading" status', async () => {
    const result = await createBook(testInputReading);

    expect(result.title).toEqual('1984');
    expect(result.author).toEqual('George Orwell');
    expect(result.genre).toEqual('Dystopian Fiction');
    expect(result.reading_status).toEqual('Reading');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a book with "Finished" status', async () => {
    const result = await createBook(testInputFinished);

    expect(result.title).toEqual('To Kill a Mockingbird');
    expect(result.author).toEqual('Harper Lee');
    expect(result.genre).toEqual('Classic Literature');
    expect(result.reading_status).toEqual('Finished');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save book to database correctly', async () => {
    const result = await createBook(testInputToRead);

    // Query the database to verify the book was saved
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    const savedBook = books[0];
    expect(savedBook.title).toEqual('The Great Gatsby');
    expect(savedBook.author).toEqual('F. Scott Fitzgerald');
    expect(savedBook.genre).toEqual('Classic Fiction');
    expect(savedBook.reading_status).toEqual('To Read');
    expect(savedBook.created_at).toBeInstanceOf(Date);
    expect(savedBook.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple books', async () => {
    const book1 = await createBook(testInputToRead);
    const book2 = await createBook(testInputReading);
    const book3 = await createBook(testInputFinished);

    // Ensure all books have unique IDs
    expect(book1.id).not.toEqual(book2.id);
    expect(book1.id).not.toEqual(book3.id);
    expect(book2.id).not.toEqual(book3.id);

    // Verify all books are saved in database
    const allBooks = await db.select().from(booksTable).execute();
    expect(allBooks).toHaveLength(3);
    
    // Check that all books have different titles (confirming they're different records)
    const titles = allBooks.map(book => book.title);
    expect(titles).toContain('The Great Gatsby');
    expect(titles).toContain('1984');
    expect(titles).toContain('To Kill a Mockingbird');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createBook(testInputToRead);
    const afterCreation = new Date();

    // Timestamps should be within the test execution timeframe
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Both timestamps should be very close (created at the same time)
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});
