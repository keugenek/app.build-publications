import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type FilterBooksInput } from '../schema';
import { getBooks } from '../handlers/get_books';
import { eq } from 'drizzle-orm';

describe('getBooks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(booksTable).values([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        status: 'completed'
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        status: 'reading'
      },
      {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        status: 'to-read'
      },
      {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        genre: 'Romance',
        status: 'completed'
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should return all books when no filters are applied', async () => {
    const result = await getBooks();
    
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Fiction',
      status: 'completed'
    });
    
    // Check that dates are properly converted
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter books by search term in title', async () => {
    const result = await getBooks({ search: 'Great' });
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('The Great Gatsby');
  });

  it('should filter books by search term in author', async () => {
    const result = await getBooks({ search: 'Orwell' });
    
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('George Orwell');
  });

  it('should filter books by genre', async () => {
    const result = await getBooks({ genre: 'Fiction' });
    
    expect(result).toHaveLength(2);
    expect(result.every(book => book.genre === 'Fiction')).toBe(true);
  });

  it('should filter books by status', async () => {
    const result = await getBooks({ status: 'completed' });
    
    expect(result).toHaveLength(2);
    expect(result.every(book => book.status === 'completed')).toBe(true);
  });

  it('should combine multiple filters', async () => {
    const result = await getBooks({ 
      search: 'Pride', 
      status: 'completed' 
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pride and Prejudice');
    expect(result[0].status).toBe('completed');
  });

  it('should return empty array when no books match filters', async () => {
    const result = await getBooks({ 
      search: 'Nonexistent', 
      genre: 'Sci-Fi' 
    });
    
    expect(result).toHaveLength(0);
  });

  it('should return books ordered by creation date', async () => {
    const result = await getBooks();
    
    // Verify ordering by checking that the first book was created before the last
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(
      result[result.length - 1].created_at.getTime()
    );
  });
});
