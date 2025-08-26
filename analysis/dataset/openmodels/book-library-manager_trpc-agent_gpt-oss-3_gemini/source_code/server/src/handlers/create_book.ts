import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type Book } from '../schema';

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  try {
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

    // Drizzle returns an array; the inserted row is the first element
    const book = result[0];
    return book;
  } catch (error) {
    console.error('Book creation failed:', error);
    throw error;
  }
};
