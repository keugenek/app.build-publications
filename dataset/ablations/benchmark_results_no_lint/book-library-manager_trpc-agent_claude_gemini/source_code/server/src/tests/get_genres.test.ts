import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { getGenres } from '../handlers/get_genres';

describe('getGenres', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no books exist', async () => {
    const result = await getGenres();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return unique genres from books', async () => {
    // Create test books with different genres
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
        genre: 'Science Fiction',
        reading_status: 'Reading'
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Mystery',
        reading_status: 'Finished'
      }
    ]).execute();

    const result = await getGenres();

    expect(result).toHaveLength(3);
    expect(result).toContain('Fiction');
    expect(result).toContain('Science Fiction');
    expect(result).toContain('Mystery');
  });

  it('should return genres in alphabetical order', async () => {
    // Create test books with genres in non-alphabetical order
    await db.insert(booksTable).values([
      {
        title: 'Book 1',
        author: 'Author 1',
        genre: 'Zombie Fiction',
        reading_status: 'To Read'
      },
      {
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Adventure',
        reading_status: 'Reading'
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Mystery',
        reading_status: 'Finished'
      }
    ]).execute();

    const result = await getGenres();

    expect(result).toEqual(['Adventure', 'Mystery', 'Zombie Fiction']);
  });

  it('should return only unique genres when duplicates exist', async () => {
    // Create multiple books with same genres
    await db.insert(booksTable).values([
      {
        title: 'Fiction Book 1',
        author: 'Author 1',
        genre: 'Fiction',
        reading_status: 'To Read'
      },
      {
        title: 'Fiction Book 2',
        author: 'Author 2',
        genre: 'Fiction',
        reading_status: 'Reading'
      },
      {
        title: 'Mystery Book 1',
        author: 'Author 3',
        genre: 'Mystery',
        reading_status: 'Finished'
      },
      {
        title: 'Mystery Book 2',
        author: 'Author 4',
        genre: 'Mystery',
        reading_status: 'To Read'
      }
    ]).execute();

    const result = await getGenres();

    expect(result).toHaveLength(2);
    expect(result).toEqual(['Fiction', 'Mystery']);
  });

  it('should handle mixed case genres correctly', async () => {
    // Create books with genres in different cases
    await db.insert(booksTable).values([
      {
        title: 'Book 1',
        author: 'Author 1',
        genre: 'fiction',
        reading_status: 'To Read'
      },
      {
        title: 'Book 2',
        author: 'Author 2',
        genre: 'Fiction',
        reading_status: 'Reading'
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'MYSTERY',
        reading_status: 'Finished'
      }
    ]).execute();

    const result = await getGenres();

    expect(result).toHaveLength(3);
    expect(result).toEqual(['Fiction', 'MYSTERY', 'fiction']);
  });

  it('should handle special characters and spaces in genre names', async () => {
    // Create books with genres containing special characters
    await db.insert(booksTable).values([
      {
        title: 'Book 1',
        author: 'Author 1',
        genre: 'Science Fiction & Fantasy',
        reading_status: 'To Read'
      },
      {
        title: 'Book 2',
        author: 'Author 2',
        genre: 'True Crime - Investigation',
        reading_status: 'Reading'
      },
      {
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Children\'s Literature',
        reading_status: 'Finished'
      }
    ]).execute();

    const result = await getGenres();

    expect(result).toHaveLength(3);
    expect(result).toContain('Science Fiction & Fantasy');
    expect(result).toContain('True Crime - Investigation');
    expect(result).toContain('Children\'s Literature');
  });
});
