import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { getBooks } from '../handlers/get_books';

// Test data
const testBooks: CreateBookInput[] = [
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
    genre: 'Dystopian Fiction',
    status: 'to_read'
  }
];

describe('getBooks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const book of testBooks) {
      await db.insert(booksTable).values(book).execute();
    }
  });
  
  afterEach(resetDB);

  it('should fetch all books from the database', async () => {
    const books = await getBooks();

    expect(books).toHaveLength(3);
    
    // Check that all books are returned with correct properties
    books.forEach((book, index) => {
      expect(book).toMatchObject({
        title: testBooks[index].title,
        author: testBooks[index].author,
        genre: testBooks[index].genre,
        status: testBooks[index].status
      });
      
      expect(book.id).toBeDefined();
      expect(book.created_at).toBeInstanceOf(Date);
      expect(book.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return books ordered by creation date', async () => {
    const books = await getBooks();
    
    // Books should be ordered by created_at ascending
    for (let i = 1; i < books.length; i++) {
      expect(books[i].created_at.getTime()).toBeGreaterThanOrEqual(
        books[i - 1].created_at.getTime()
      );
    }
  });

  it('should return empty array when no books exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const books = await getBooks();
    
    expect(books).toHaveLength(0);
    expect(books).toEqual([]);
  });
});
