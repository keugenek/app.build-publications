import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type Book } from '../schema';
import { getBooks } from '../handlers/get_books';

describe('getBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no books exist', async () => {
    const result = await getBooks();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all books', async () => {
    // Create test books
    await db.insert(booksTable).values([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        reading_status: 'Finished'
      },
      {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        reading_status: 'Reading'
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Fiction',
        reading_status: 'To Read'
      }
    ]).execute();

    const result = await getBooks();

    expect(result).toHaveLength(3);
    expect(result.every(book => typeof book.id === 'number')).toBe(true);
    expect(result.every(book => typeof book.title === 'string')).toBe(true);
    expect(result.every(book => typeof book.author === 'string')).toBe(true);
    expect(result.every(book => typeof book.genre === 'string')).toBe(true);
    expect(result.every(book => ['To Read', 'Reading', 'Finished'].includes(book.reading_status))).toBe(true);
    expect(result.every(book => book.created_at instanceof Date)).toBe(true);
    expect(result.every(book => book.updated_at instanceof Date)).toBe(true);
  });

  it('should return books ordered by creation date (newest first)', async () => {
    // Create books with slight delays to ensure different timestamps
    const book1 = await db.insert(booksTable).values({
      title: 'First Book',
      author: 'Author A',
      genre: 'Fiction',
      reading_status: 'To Read'
    }).returning().execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const book2 = await db.insert(booksTable).values({
      title: 'Second Book',
      author: 'Author B',
      genre: 'Non-fiction',
      reading_status: 'Reading'
    }).returning().execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const book3 = await db.insert(booksTable).values({
      title: 'Third Book',
      author: 'Author C',
      genre: 'Mystery',
      reading_status: 'Finished'
    }).returning().execute();

    const result = await getBooks();

    expect(result).toHaveLength(3);
    
    // Verify books are ordered newest first (by created_at)
    expect(result[0].title).toEqual('Third Book');
    expect(result[1].title).toEqual('Second Book');
    expect(result[2].title).toEqual('First Book');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle different reading statuses correctly', async () => {
    await db.insert(booksTable).values([
      {
        title: 'Book 1',
        author: 'Author 1',
        genre: 'Fiction',
        reading_status: 'To Read'
      },
      {
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Non-fiction',
        reading_status: 'Reading'
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Mystery',
        reading_status: 'Finished'
      }
    ]).execute();

    const result = await getBooks();

    expect(result).toHaveLength(3);
    
    // Verify all reading statuses are present and valid
    const statuses = result.map(book => book.reading_status);
    expect(statuses).toContain('To Read');
    expect(statuses).toContain('Reading');
    expect(statuses).toContain('Finished');
    
    // Verify each status is one of the valid enum values
    result.forEach(book => {
      expect(['To Read', 'Reading', 'Finished']).toContain(book.reading_status);
    });
  });

  it('should return books with valid timestamps', async () => {
    await db.insert(booksTable).values({
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Test Genre',
      reading_status: 'To Read'
    }).execute();

    const result = await getBooks();
    const book = result[0];

    expect(book.created_at).toBeInstanceOf(Date);
    expect(book.updated_at).toBeInstanceOf(Date);
    expect(book.created_at.getTime()).toBeLessThanOrEqual(Date.now());
    expect(book.updated_at.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
