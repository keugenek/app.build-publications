import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { getGenres } from '../handlers/get_genres';
import { type CreateBookInput } from '../schema';

const testBooks: CreateBookInput[] = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    reading_status: 'Read'
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopian',
    reading_status: 'Currently Reading'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    reading_status: 'Want to Read'
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Science Fiction',
    reading_status: 'Read'
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    reading_status: 'Read'
  }
];

describe('getGenres', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no books exist', async () => {
    const genres = await getGenres();
    expect(genres).toEqual([]);
  });

  it('should return all unique genres sorted alphabetically', async () => {
    // Insert test books
    await db.insert(booksTable)
      .values(testBooks)
      .execute();

    const genres = await getGenres();

    // Expected genres in alphabetical order
    const expectedGenres = ['Dystopian', 'Fantasy', 'Fiction', 'Science Fiction'];
    expect(genres).toEqual(expectedGenres);
  });

  it('should handle duplicate genres correctly', async () => {
    // Insert books with duplicate genres
    const booksWithDuplicates = [
      {
        title: 'Book 1',
        author: 'Author 1',
        genre: 'Romance',
        reading_status: 'Read' as const
      },
      {
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Romance',
        reading_status: 'Currently Reading' as const
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Mystery',
        reading_status: 'Want to Read' as const
      }
    ];

    await db.insert(booksTable)
      .values(booksWithDuplicates)
      .execute();

    const genres = await getGenres();

    // Should only return unique genres
    expect(genres).toEqual(['Mystery', 'Romance']);
    expect(genres).toHaveLength(2);
  });

  it('should return genres in alphabetical order', async () => {
    // Insert books with genres in random order
    const randomOrderBooks = [
      {
        title: 'Zebra Book',
        author: 'Author Z',
        genre: 'Western',
        reading_status: 'Read' as const
      },
      {
        title: 'Alpha Book',
        author: 'Author A',
        genre: 'Adventure',
        reading_status: 'Currently Reading' as const
      },
      {
        title: 'Middle Book',
        author: 'Author M',
        genre: 'Mystery',
        reading_status: 'Want to Read' as const
      }
    ];

    await db.insert(booksTable)
      .values(randomOrderBooks)
      .execute();

    const genres = await getGenres();

    // Should be in alphabetical order
    expect(genres).toEqual(['Adventure', 'Mystery', 'Western']);
    
    // Verify sorting is correct
    for (let i = 1; i < genres.length; i++) {
      expect(genres[i-1].localeCompare(genres[i])).toBeLessThan(0);
    }
  });

  it('should handle single genre correctly', async () => {
    await db.insert(booksTable)
      .values([{
        title: 'Solo Book',
        author: 'Solo Author',
        genre: 'Biography',
        reading_status: 'Read'
      }])
      .execute();

    const genres = await getGenres();
    expect(genres).toEqual(['Biography']);
    expect(genres).toHaveLength(1);
  });

  it('should handle case-sensitive genre names', async () => {
    // Insert books with similar but case-different genres
    const caseSensitiveBooks = [
      {
        title: 'Book 1',
        author: 'Author 1',
        genre: 'fiction',
        reading_status: 'Read' as const
      },
      {
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Fiction',
        reading_status: 'Currently Reading' as const
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'FICTION',
        reading_status: 'Want to Read' as const
      }
    ];

    await db.insert(booksTable)
      .values(caseSensitiveBooks)
      .execute();

    const genres = await getGenres();

    // Should treat case-different genres as separate
    expect(genres).toEqual(['FICTION', 'Fiction', 'fiction']);
    expect(genres).toHaveLength(3);
  });
});
