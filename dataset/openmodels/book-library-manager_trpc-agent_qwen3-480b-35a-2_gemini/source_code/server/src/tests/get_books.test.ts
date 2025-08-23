import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type SearchBooksInput } from '../schema';
import { getBooks } from '../handlers/get_books';

// Test data
const testBooks: CreateBookInput[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    status: 'Read'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    status: 'Reading'
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopian',
    status: 'Unread'
  }
];

describe('getBooks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test books
    for (const book of testBooks) {
      await db.insert(booksTable).values(book).execute();
    }
  });
  
  afterEach(resetDB);

  it('should return all books when no filters are provided', async () => {
    const result = await getBooks();
    
    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('The Great Gatsby');
    expect(result[0].author).toEqual('F. Scott Fitzgerald');
    expect(result[0].genre).toEqual('Fiction');
    expect(result[0].status).toEqual('Read');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter books by search query in title', async () => {
    const input: SearchBooksInput = { query: 'Gatsby' };
    const result = await getBooks(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('The Great Gatsby');
  });

  it('should filter books by search query in author', async () => {
    const input: SearchBooksInput = { query: 'George' };
    const result = await getBooks(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('1984');
    expect(result[0].author).toEqual('George Orwell');
  });

  it('should filter books by status', async () => {
    const input: SearchBooksInput = { status: 'Read' };
    const result = await getBooks(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('Read');
  });

  it('should filter books by genre', async () => {
    const input: SearchBooksInput = { genre: 'Fiction' };
    const result = await getBooks(input);
    
    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(book.genre).toEqual('Fiction');
    });
  });

  it('should filter books by multiple criteria', async () => {
    const input: SearchBooksInput = { 
      query: 'Harper', 
      status: 'Reading' 
    };
    const result = await getBooks(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('To Kill a Mockingbird');
    expect(result[0].author).toEqual('Harper Lee');
    expect(result[0].status).toEqual('Reading');
  });

  it('should return empty array when no books match filters', async () => {
    const input: SearchBooksInput = { 
      query: 'Nonexistent Book' 
    };
    const result = await getBooks(input);
    
    expect(result).toHaveLength(0);
  });
});
