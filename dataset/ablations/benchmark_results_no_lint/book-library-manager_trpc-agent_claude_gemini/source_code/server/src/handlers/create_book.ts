import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type Book } from '../schema';

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  try {
    // Insert book record
    const result = await db.insert(booksTable)
      .values({
        title: input.title,
        author: input.author,
        genre: input.genre,
        reading_status: input.reading_status
      })
      .returning()
      .execute();

    // Return the created book
    const book = result[0];
    return {
      ...book
    };
  } catch (error) {
    console.error('Book creation failed:', error);
    throw error;
  }
};
