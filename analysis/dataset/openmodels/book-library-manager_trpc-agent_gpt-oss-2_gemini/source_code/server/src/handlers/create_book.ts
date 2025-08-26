import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type Book } from '../schema';

/**
 * Creates a new book record in the database and returns the created book.
 * The input is assumed to be already validated (e.g., via Zod) and contains all
 * required fields. The handler inserts the record, retrieves the generated fields
 * (id, created_at) and returns a fully populated Book object.
 */
export const createBook = async (input: CreateBookInput): Promise<Book> => {
  try {
    // Insert new book record
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

    // Drizzle returns an array; the first element is the inserted row
    const book = result[0];
    return book as Book;
  } catch (error) {
    console.error('Book creation failed:', error);
    throw error;
  }
};
