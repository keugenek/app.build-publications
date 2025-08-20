import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type FilterBooksInput, type CreateBookInput } from '../schema';
import { getBooks, getAllBooks } from '../handlers/get_books';

// Test data for creating books
const testBooks: CreateBookInput[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    reading_status: 'Finished'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    reading_status: 'Reading'
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    genre: 'Technology',
    reading_status: 'To Read'
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopian',
    reading_status: 'Finished'
  }
];

// Helper function to create test books
const createTestBooks = async () => {
  const promises = testBooks.map(book =>
    db.insert(booksTable).values(book).returning().execute()
  );
  return await Promise.all(promises);
};

describe('getBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all books when no filter is provided', async () => {
    await createTestBooks();
    
    const result = await getBooks();

    expect(result).toHaveLength(4);
    expect(result[0].title).toBeDefined();
    expect(result[0].author).toBeDefined();
    expect(result[0].genre).toBeDefined();
    expect(result[0].reading_status).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return books ordered by created_at desc', async () => {
    await createTestBooks();
    
    const result = await getBooks();

    // Check that books are ordered by creation time (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should filter books by search term in title', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { search: 'gatsby' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Great Gatsby');
  });

  it('should filter books by search term in author', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { search: 'crockford' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].author).toEqual('Douglas Crockford');
  });

  it('should perform case-insensitive search', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { search: 'GATSBY' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Great Gatsby');
  });

  it('should filter books by genre', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { genre: 'Fiction' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(book.genre).toEqual('Fiction');
    });
  });

  it('should filter books by reading status', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { reading_status: 'Finished' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(book.reading_status).toEqual('Finished');
    });
  });

  it('should apply multiple filters simultaneously', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { 
      genre: 'Fiction', 
      reading_status: 'Reading' 
    };
    const result = await getBooks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('To Kill a Mockingbird');
    expect(result[0].genre).toEqual('Fiction');
    expect(result[0].reading_status).toEqual('Reading');
  });

  it('should return empty array when no books match filter', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { genre: 'NonExistent' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when database is empty', async () => {
    const result = await getBooks();

    expect(result).toHaveLength(0);
  });

  it('should handle search with partial matches', async () => {
    await createTestBooks();
    
    const filter: FilterBooksInput = { search: 'Kill' };
    const result = await getBooks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('To Kill a Mockingbird');
  });
});

describe('getAllBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all books ordered by created_at desc', async () => {
    await createTestBooks();
    
    const result = await getAllBooks();

    expect(result).toHaveLength(4);
    
    // Verify all books are included
    const titles = result.map(book => book.title);
    expect(titles).toContain('The Great Gatsby');
    expect(titles).toContain('To Kill a Mockingbird');
    expect(titles).toContain('JavaScript: The Good Parts');
    expect(titles).toContain('1984');

    // Check ordering by created_at desc
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should return empty array when no books exist', async () => {
    const result = await getAllBooks();

    expect(result).toHaveLength(0);
  });

  it('should return books with proper data types', async () => {
    await createTestBooks();
    
    const result = await getAllBooks();

    expect(result.length).toBeGreaterThan(0);
    
    const book = result[0];
    expect(typeof book.id).toBe('number');
    expect(typeof book.title).toBe('string');
    expect(typeof book.author).toBe('string');
    expect(typeof book.genre).toBe('string');
    expect(['To Read', 'Reading', 'Finished']).toContain(book.reading_status);
    expect(book.created_at).toBeInstanceOf(Date);
    expect(book.updated_at).toBeInstanceOf(Date);
  });
});
