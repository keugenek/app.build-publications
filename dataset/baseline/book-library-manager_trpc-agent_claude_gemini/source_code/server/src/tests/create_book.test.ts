import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Simple test input with required fields only
const minimalInput: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Fiction',
  reading_status: 'To Read'
};

// Complete test input with all fields
const completeInput: CreateBookInput = {
  title: 'To Kill a Mockingbird',
  author: 'Harper Lee',
  genre: 'Fiction',
  reading_status: 'Reading',
  isbn: '978-0061120084',
  pages: 376,
  publication_year: 1960,
  notes: 'A classic American novel about justice and morality'
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book with minimal required fields', async () => {
    const result = await createBook(minimalInput);

    // Basic field validation
    expect(result.title).toEqual('The Great Gatsby');
    expect(result.author).toEqual('F. Scott Fitzgerald');
    expect(result.genre).toEqual('Fiction');
    expect(result.reading_status).toEqual('To Read'); // Default value applied
    expect(result.isbn).toBeNull();
    expect(result.pages).toBeNull();
    expect(result.publication_year).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a book with all fields provided', async () => {
    const result = await createBook(completeInput);

    // Validate all fields
    expect(result.title).toEqual('To Kill a Mockingbird');
    expect(result.author).toEqual('Harper Lee');
    expect(result.genre).toEqual('Fiction');
    expect(result.reading_status).toEqual('Reading');
    expect(result.isbn).toEqual('978-0061120084');
    expect(result.pages).toEqual(376);
    expect(result.publication_year).toEqual(1960);
    expect(result.notes).toEqual('A classic American novel about justice and morality');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save book to database correctly', async () => {
    const result = await createBook(completeInput);

    // Query the database to verify data was saved
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    const savedBook = books[0];
    
    expect(savedBook.title).toEqual('To Kill a Mockingbird');
    expect(savedBook.author).toEqual('Harper Lee');
    expect(savedBook.genre).toEqual('Fiction');
    expect(savedBook.reading_status).toEqual('Reading');
    expect(savedBook.isbn).toEqual('978-0061120084');
    expect(savedBook.pages).toEqual(376);
    expect(savedBook.publication_year).toEqual(1960);
    expect(savedBook.notes).toEqual('A classic American novel about justice and morality');
    expect(savedBook.created_at).toBeInstanceOf(Date);
    expect(savedBook.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different reading status values', async () => {
    const toReadInput: CreateBookInput = {
      ...minimalInput,
      title: 'Book 1',
      reading_status: 'To Read'
    };

    const readingInput: CreateBookInput = {
      ...minimalInput,
      title: 'Book 2',
      reading_status: 'Reading'
    };

    const finishedInput: CreateBookInput = {
      ...minimalInput,
      title: 'Book 3',
      reading_status: 'Finished'
    };

    const result1 = await createBook(toReadInput);
    const result2 = await createBook(readingInput);
    const result3 = await createBook(finishedInput);

    expect(result1.reading_status).toEqual('To Read');
    expect(result2.reading_status).toEqual('Reading');
    expect(result3.reading_status).toEqual('Finished');
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: CreateBookInput = {
      title: 'Null Fields Book',
      author: 'Test Author',
      genre: 'Test Genre',
      reading_status: 'To Read',
      isbn: null,
      pages: null,
      publication_year: null,
      notes: null
    };

    const result = await createBook(inputWithNulls);

    expect(result.isbn).toBeNull();
    expect(result.pages).toBeNull();
    expect(result.publication_year).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should create multiple books with unique IDs', async () => {
    const book1Input: CreateBookInput = {
      title: 'First Book',
      author: 'Author One',
      genre: 'Genre One',
      reading_status: 'To Read'
    };

    const book2Input: CreateBookInput = {
      title: 'Second Book',
      author: 'Author Two',
      genre: 'Genre Two',
      reading_status: 'To Read'
    };

    const result1 = await createBook(book1Input);
    const result2 = await createBook(book2Input);

    // Verify unique IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Book');
    expect(result2.title).toEqual('Second Book');

    // Verify both books exist in database
    const allBooks = await db.select()
      .from(booksTable)
      .execute();

    expect(allBooks).toHaveLength(2);
  });
});
