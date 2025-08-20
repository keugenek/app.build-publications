import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBooksQuery, type CreateBookInput } from '../schema';
import { getBooks } from '../handlers/get_books';

// Test data for books
const testBooks: CreateBookInput[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    reading_status: 'Read'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    reading_status: 'Currently Reading'
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    genre: 'Technology',
    reading_status: 'Want to Read'
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Technology',
    reading_status: 'Read'
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    reading_status: 'Read'
  }
];

describe('getBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test books before each test
    await db.insert(booksTable)
      .values(testBooks)
      .execute();
  });

  it('should return all books when no query provided', async () => {
    const result = await getBooks();

    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      author: expect.any(String),
      genre: expect.any(String),
      reading_status: expect.any(String),
      created_at: expect.any(Date),
      updated_at: expect.any(Date)
    });
  });

  it('should return all books when empty query provided', async () => {
    const result = await getBooks({});

    expect(result).toHaveLength(5);
  });

  it('should search books by title (case-insensitive)', async () => {
    const query: GetBooksQuery = { search: 'gatsby' };
    const result = await getBooks(query);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Great Gatsby');
  });

  it('should search books by author (case-insensitive)', async () => {
    const query: GetBooksQuery = { search: 'tolkien' };
    const result = await getBooks(query);

    expect(result).toHaveLength(1);
    expect(result[0].author).toEqual('J.R.R. Tolkien');
  });

  it('should search books with partial matches', async () => {
    const query: GetBooksQuery = { search: 'code' };
    const result = await getBooks(query);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Clean Code');
  });

  it('should search books with partial matches across multiple books', async () => {
    const query: GetBooksQuery = { search: 'the' };
    const result = await getBooks(query);

    expect(result).toHaveLength(3); // "The Great Gatsby", "The Hobbit", "JavaScript: The Good Parts"
    const titles = result.map(book => book.title);
    expect(titles).toContain('The Great Gatsby');
    expect(titles).toContain('The Hobbit');
    expect(titles).toContain('JavaScript: The Good Parts');
  });

  it('should filter books by genre', async () => {
    const query: GetBooksQuery = { genre: 'Fiction' };
    const result = await getBooks(query);

    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(book.genre).toEqual('Fiction');
    });
  });

  it('should filter books by reading status', async () => {
    const query: GetBooksQuery = { reading_status: 'Read' };
    const result = await getBooks(query);

    expect(result).toHaveLength(3);
    result.forEach(book => {
      expect(book.reading_status).toEqual('Read');
    });
  });

  it('should combine search and genre filter', async () => {
    const query: GetBooksQuery = { 
      search: 'javascript',
      genre: 'Technology' 
    };
    const result = await getBooks(query);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('JavaScript: The Good Parts');
    expect(result[0].genre).toEqual('Technology');
  });

  it('should combine search and reading status filter', async () => {
    const query: GetBooksQuery = { 
      search: 'the',
      reading_status: 'Read' 
    };
    const result = await getBooks(query);

    expect(result).toHaveLength(2);
    const titles = result.map(book => book.title);
    expect(titles).toContain('The Great Gatsby');
    expect(titles).toContain('The Hobbit');
    result.forEach(book => {
      expect(book.reading_status).toEqual('Read');
    });
  });

  it('should combine all filters', async () => {
    const query: GetBooksQuery = { 
      search: 'clean',
      genre: 'Technology',
      reading_status: 'Read'
    };
    const result = await getBooks(query);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Clean Code');
    expect(result[0].genre).toEqual('Technology');
    expect(result[0].reading_status).toEqual('Read');
  });

  it('should return empty array when no matches found', async () => {
    const query: GetBooksQuery = { search: 'nonexistent book' };
    const result = await getBooks(query);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when genre filter has no matches', async () => {
    const query: GetBooksQuery = { genre: 'NonExistentGenre' };
    const result = await getBooks(query);

    expect(result).toHaveLength(0);
  });

  it('should handle case-sensitive genre matching', async () => {
    const query: GetBooksQuery = { genre: 'fiction' }; // lowercase
    const result = await getBooks(query);

    expect(result).toHaveLength(0); // Should not match 'Fiction' with capital F
  });

  it('should validate returned book structure', async () => {
    const result = await getBooks();
    
    expect(result.length).toBeGreaterThan(0);
    
    const book = result[0];
    expect(book.id).toBeTypeOf('number');
    expect(book.title).toBeTypeOf('string');
    expect(book.author).toBeTypeOf('string');
    expect(book.genre).toBeTypeOf('string');
    expect(book.reading_status).toBeTypeOf('string');
    expect(book.created_at).toBeInstanceOf(Date);
    expect(book.updated_at).toBeInstanceOf(Date);
  });
});
