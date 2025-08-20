import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Classic Fiction',
  reading_status: 'Want to Read'
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book with all required fields', async () => {
    const result = await createBook(testInput);

    // Basic field validation
    expect(result.title).toEqual('The Great Gatsby');
    expect(result.author).toEqual('F. Scott Fitzgerald');
    expect(result.genre).toEqual('Classic Fiction');
    expect(result.reading_status).toEqual('Want to Read');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save book to database correctly', async () => {
    const result = await createBook(testInput);

    // Query the database to verify the book was saved
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    expect(books[0].title).toEqual('The Great Gatsby');
    expect(books[0].author).toEqual('F. Scott Fitzgerald');
    expect(books[0].genre).toEqual('Classic Fiction');
    expect(books[0].reading_status).toEqual('Want to Read');
    expect(books[0].created_at).toBeInstanceOf(Date);
    expect(books[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create book with "Read" status', async () => {
    const readInput: CreateBookInput = {
      title: '1984',
      author: 'George Orwell',
      genre: 'Dystopian Fiction',
      reading_status: 'Read'
    };

    const result = await createBook(readInput);

    expect(result.reading_status).toEqual('Read');
    expect(result.title).toEqual('1984');
    expect(result.author).toEqual('George Orwell');
    expect(result.genre).toEqual('Dystopian Fiction');
  });

  it('should create book with "Currently Reading" status', async () => {
    const currentlyReadingInput: CreateBookInput = {
      title: 'Dune',
      author: 'Frank Herbert',
      genre: 'Science Fiction',
      reading_status: 'Currently Reading'
    };

    const result = await createBook(currentlyReadingInput);

    expect(result.reading_status).toEqual('Currently Reading');
    expect(result.title).toEqual('Dune');
    expect(result.author).toEqual('Frank Herbert');
    expect(result.genre).toEqual('Science Fiction');
  });

  it('should create multiple books independently', async () => {
    const book1Input: CreateBookInput = {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      genre: 'Romance',
      reading_status: 'Read'
    };

    const book2Input: CreateBookInput = {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      genre: 'Fantasy',
      reading_status: 'Want to Read'
    };

    const result1 = await createBook(book1Input);
    const result2 = await createBook(book2Input);

    // Verify both books were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('Pride and Prejudice');
    expect(result2.title).toEqual('The Hobbit');

    // Verify both are in the database
    const allBooks = await db.select().from(booksTable).execute();
    expect(allBooks).toHaveLength(2);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createBook(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
    expect(result.updated_at >= beforeCreation).toBe(true);
    expect(result.updated_at <= afterCreation).toBe(true);
  });
});
