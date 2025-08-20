import { type CreateBookInput, type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';

/**
 * Handler for creating a new book record in the database.
 * Inserts the provided book data and returns the created book with its generated ID and timestamp.
 */
export const createBook = async (input: CreateBookInput): Promise<Book> => {
  try {
    // Insert the new book and return the created record
    const result = await db
      .insert(booksTable)
      .values({
        title: input.title,
        author: input.author,
        genre: input.genre,
        reading_status: input.reading_status,
      })
      .returning()
      .execute();

    // The result is an array with a single inserted row
    const book = result[0];
    return book;
  } catch (error) {
    console.error('Failed to create book:', error);
    throw error;
  }
};
