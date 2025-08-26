import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

describe('updateBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test book
  const createTestBook = async () => {
    const result = await db.insert(booksTable)
      .values({
        title: 'Original Title',
        author: 'Original Author',
        genre: 'Fiction',
        reading_status: 'To Read',
        isbn: '1234567890',
        pages: 300,
        publication_year: 2020,
        notes: 'Original notes'
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should update a book with all fields', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Updated Title',
      author: 'Updated Author',
      genre: 'Non-Fiction',
      reading_status: 'Reading',
      isbn: '0987654321',
      pages: 250,
      publication_year: 2023,
      notes: 'Updated notes'
    };

    const result = await updateBook(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(testBook.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.author).toEqual('Updated Author');
    expect(result.genre).toEqual('Non-Fiction');
    expect(result.reading_status).toEqual('Reading');
    expect(result.isbn).toEqual('0987654321');
    expect(result.pages).toEqual(250);
    expect(result.publication_year).toEqual(2023);
    expect(result.notes).toEqual('Updated notes');
    expect(result.created_at).toEqual(testBook.created_at);
    expect(result.updated_at).not.toEqual(testBook.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Partially Updated Title',
      reading_status: 'Finished'
    };

    const result = await updateBook(updateInput);

    // Verify only specified fields are updated
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.reading_status).toEqual('Finished');
    // Other fields should remain unchanged
    expect(result.author).toEqual('Original Author');
    expect(result.genre).toEqual('Fiction');
    expect(result.isbn).toEqual('1234567890');
    expect(result.pages).toEqual(300);
    expect(result.publication_year).toEqual(2020);
    expect(result.notes).toEqual('Original notes');
    expect(result.updated_at).not.toEqual(testBook.updated_at);
  });

  it('should update nullable fields to null', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      isbn: null,
      pages: null,
      publication_year: null,
      notes: null
    };

    const result = await updateBook(updateInput);

    // Verify nullable fields are set to null
    expect(result.isbn).toBeNull();
    expect(result.pages).toBeNull();
    expect(result.publication_year).toBeNull();
    expect(result.notes).toBeNull();
    // Required fields should remain unchanged
    expect(result.title).toEqual('Original Title');
    expect(result.author).toEqual('Original Author');
    expect(result.genre).toEqual('Fiction');
    expect(result.reading_status).toEqual('To Read');
  });

  it('should save updates to database', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Database Test Title',
      reading_status: 'Reading'
    };

    await updateBook(updateInput);

    // Query database to verify changes persisted
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, testBook.id))
      .execute();

    expect(books).toHaveLength(1);
    const savedBook = books[0];
    expect(savedBook.title).toEqual('Database Test Title');
    expect(savedBook.reading_status).toEqual('Reading');
    expect(savedBook.author).toEqual('Original Author');
    expect(savedBook.updated_at).not.toEqual(testBook.updated_at);
  });

  it('should throw error for non-existent book', async () => {
    const updateInput: UpdateBookInput = {
      id: 99999,
      title: 'Non-existent Book'
    };

    await expect(updateBook(updateInput)).rejects.toThrow(/Book with ID 99999 not found/i);
  });

  it('should handle updating reading status to different values', async () => {
    const testBook = await createTestBook();
    
    // Test all possible reading status values
    const statusTests = [
      { status: 'Reading' as const },
      { status: 'Finished' as const },
      { status: 'To Read' as const }
    ];

    for (const test of statusTests) {
      const updateInput: UpdateBookInput = {
        id: testBook.id,
        reading_status: test.status
      };

      const result = await updateBook(updateInput);
      expect(result.reading_status).toEqual(test.status);
    }
  });

  it('should preserve created_at timestamp', async () => {
    const testBook = await createTestBook();
    const originalCreatedAt = testBook.created_at;
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      title: 'Updated Title'
    };

    const result = await updateBook(updateInput);

    // created_at should not change
    expect(result.created_at).toEqual(originalCreatedAt);
    // updated_at should change
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });

  it('should handle edge case publication years', async () => {
    const testBook = await createTestBook();
    
    const updateInput: UpdateBookInput = {
      id: testBook.id,
      publication_year: 1000 // Minimum allowed year
    };

    const result = await updateBook(updateInput);
    expect(result.publication_year).toEqual(1000);

    // Test current year
    const currentYear = new Date().getFullYear();
    const updateInput2: UpdateBookInput = {
      id: testBook.id,
      publication_year: currentYear
    };

    const result2 = await updateBook(updateInput2);
    expect(result2.publication_year).toEqual(currentYear);
  });
});
