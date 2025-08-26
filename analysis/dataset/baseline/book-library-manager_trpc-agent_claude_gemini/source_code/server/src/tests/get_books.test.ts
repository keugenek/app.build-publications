import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { getBooks } from '../handlers/get_books';

// Test data for creating books
const testBooks: CreateBookInput[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Classic Literature',
    reading_status: 'Finished',
    isbn: '9780743273565',
    pages: 180,
    publication_year: 1925,
    notes: 'A masterpiece of American literature'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    reading_status: 'Reading',
    isbn: '9780061120084',
    pages: 376,
    publication_year: 1960,
    notes: 'Powerful story about racial injustice'
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopian Fiction',
    reading_status: 'To Read',
    isbn: '9780451524935',
    pages: 328,
    publication_year: 1949,
    notes: null
  }
];

// Helper function to create a book in the database
const createBookInDB = async (bookData: CreateBookInput) => {
  const result = await db.insert(booksTable)
    .values({
      title: bookData.title,
      author: bookData.author,
      genre: bookData.genre,
      reading_status: bookData.reading_status || 'To Read',
      isbn: bookData.isbn || null,
      pages: bookData.pages || null,
      publication_year: bookData.publication_year || null,
      notes: bookData.notes || null
    })
    .returning()
    .execute();

  return result[0];
};

describe('getBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no books exist', async () => {
    const result = await getBooks();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should return all books from database', async () => {
    // Create test books
    for (const bookData of testBooks) {
      await createBookInDB(bookData);
    }

    const result = await getBooks();

    expect(result.length).toBe(3);
    
    // Verify all books are returned
    const titles = result.map(book => book.title);
    expect(titles).toContain('The Great Gatsby');
    expect(titles).toContain('To Kill a Mockingbird');
    expect(titles).toContain('1984');
  });

  it('should return books ordered by created_at descending', async () => {
    // Create books with slight delays to ensure different timestamps
    const book1 = await createBookInDB(testBooks[0]);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const book2 = await createBookInDB(testBooks[1]);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const book3 = await createBookInDB(testBooks[2]);

    const result = await getBooks();

    expect(result.length).toBe(3);
    
    // Verify order - most recently created should be first
    expect(result[0].id).toBe(book3.id);
    expect(result[1].id).toBe(book2.id);
    expect(result[2].id).toBe(book1.id);

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return books with all expected fields', async () => {
    const bookData = testBooks[0];
    await createBookInDB(bookData);

    const result = await getBooks();

    expect(result.length).toBe(1);
    const book = result[0];

    // Verify all fields are present
    expect(book.id).toBeDefined();
    expect(book.title).toBe('The Great Gatsby');
    expect(book.author).toBe('F. Scott Fitzgerald');
    expect(book.genre).toBe('Classic Literature');
    expect(book.reading_status).toBe('Finished');
    expect(book.isbn).toBe('9780743273565');
    expect(book.pages).toBe(180);
    expect(book.publication_year).toBe(1925);
    expect(book.notes).toBe('A masterpiece of American literature');
    expect(book.created_at).toBeInstanceOf(Date);
    expect(book.updated_at).toBeInstanceOf(Date);
  });

  it('should handle books with nullable fields correctly', async () => {
    const bookWithNulls: CreateBookInput = {
      title: 'Minimal Book',
      author: 'Unknown Author',
      genre: 'Mystery',
      reading_status: 'To Read',
      isbn: null,
      pages: null,
      publication_year: null,
      notes: null
    };

    await createBookInDB(bookWithNulls);

    const result = await getBooks();

    expect(result.length).toBe(1);
    const book = result[0];

    expect(book.title).toBe('Minimal Book');
    expect(book.author).toBe('Unknown Author');
    expect(book.genre).toBe('Mystery');
    expect(book.reading_status).toBe('To Read');
    expect(book.isbn).toBeNull();
    expect(book.pages).toBeNull();
    expect(book.publication_year).toBeNull();
    expect(book.notes).toBeNull();
  });

  it('should handle different reading statuses correctly', async () => {
    // Create books with different reading statuses
    const statusBooks = [
      { ...testBooks[0], reading_status: 'To Read' as const },
      { ...testBooks[1], reading_status: 'Reading' as const },
      { ...testBooks[2], reading_status: 'Finished' as const }
    ];

    for (const bookData of statusBooks) {
      await createBookInDB(bookData);
    }

    const result = await getBooks();

    expect(result.length).toBe(3);
    
    // Verify all reading statuses are preserved
    const statuses = result.map(book => book.reading_status).sort();
    expect(statuses).toEqual(['Finished', 'Reading', 'To Read']);
  });
});
