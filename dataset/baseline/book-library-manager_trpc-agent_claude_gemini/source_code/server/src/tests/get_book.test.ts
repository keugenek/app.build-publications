import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBookInput, type CreateBookInput } from '../schema';
import { getBook } from '../handlers/get_book';
import { eq } from 'drizzle-orm';

// Test data for creating books
const testBookData: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  genre: 'Classic Literature',
  reading_status: 'Reading',
  isbn: '978-0-7432-7356-5',
  pages: 180,
  publication_year: 1925,
  notes: 'A masterpiece of American literature'
};

const minimalBookData: CreateBookInput = {
  title: 'Simple Book',
  author: 'Unknown Author',
  genre: 'Fiction',
  reading_status: 'To Read'
  // Other optional fields will be null
};

describe('getBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a book by ID with all fields populated', async () => {
    // Create a test book first
    const insertResult = await db.insert(booksTable)
      .values({
        title: testBookData.title,
        author: testBookData.author,
        genre: testBookData.genre,
        reading_status: testBookData.reading_status!,
        isbn: testBookData.isbn!,
        pages: testBookData.pages!,
        publication_year: testBookData.publication_year!,
        notes: testBookData.notes!
      })
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Test the handler
    const input: GetBookInput = { id: createdBook.id };
    const result = await getBook(input);

    // Verify the book was found and has correct data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('The Great Gatsby');
    expect(result!.author).toEqual('F. Scott Fitzgerald');
    expect(result!.genre).toEqual('Classic Literature');
    expect(result!.reading_status).toEqual('Reading');
    expect(result!.isbn).toEqual('978-0-7432-7356-5');
    expect(result!.pages).toEqual(180);
    expect(result!.publication_year).toEqual(1925);
    expect(result!.notes).toEqual('A masterpiece of American literature');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should get a book with minimal data (null optional fields)', async () => {
    // Create a book with minimal data
    const insertResult = await db.insert(booksTable)
      .values({
        title: minimalBookData.title,
        author: minimalBookData.author,
        genre: minimalBookData.genre
        // reading_status will use default 'To Read'
        // isbn, pages, publication_year, notes will be null
      })
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Test the handler
    const input: GetBookInput = { id: createdBook.id };
    const result = await getBook(input);

    // Verify the book was found and has correct data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBook.id);
    expect(result!.title).toEqual('Simple Book');
    expect(result!.author).toEqual('Unknown Author');
    expect(result!.genre).toEqual('Fiction');
    expect(result!.reading_status).toEqual('To Read'); // Default value
    expect(result!.isbn).toBeNull();
    expect(result!.pages).toBeNull();
    expect(result!.publication_year).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent book ID', async () => {
    const input: GetBookInput = { id: 999999 };
    const result = await getBook(input);

    expect(result).toBeNull();
  });

  it('should verify book exists in database after retrieval', async () => {
    // Create a test book
    const insertResult = await db.insert(booksTable)
      .values({
        title: testBookData.title,
        author: testBookData.author,
        genre: testBookData.genre,
        reading_status: testBookData.reading_status!
      })
      .returning()
      .execute();

    const createdBook = insertResult[0];

    // Get the book using the handler
    const result = await getBook({ id: createdBook.id });

    // Verify the book exists by querying database directly
    const dbBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, createdBook.id))
      .execute();

    expect(dbBooks).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dbBooks[0].id);
    expect(result!.title).toEqual(dbBooks[0].title);
    expect(result!.author).toEqual(dbBooks[0].author);
  });

  it('should handle different reading status values correctly', async () => {
    const statuses = ['To Read', 'Reading', 'Finished'] as const;
    const bookIds: number[] = [];

    // Create books with different reading statuses
    for (const status of statuses) {
      const insertResult = await db.insert(booksTable)
        .values({
          title: `Book - ${status}`,
          author: 'Test Author',
          genre: 'Test Genre',
          reading_status: status
        })
        .returning()
        .execute();

      bookIds.push(insertResult[0].id);
    }

    // Test retrieving each book
    for (let i = 0; i < statuses.length; i++) {
      const result = await getBook({ id: bookIds[i] });
      
      expect(result).not.toBeNull();
      expect(result!.reading_status).toEqual(statuses[i]);
      expect(result!.title).toEqual(`Book - ${statuses[i]}`);
    }
  });
});
