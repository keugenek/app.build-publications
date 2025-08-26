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
        status: input.status
      })
      .returning()
      .execute();

    const book = result[0];
    
    // Convert timestamp strings to Date objects to match the Zod schema
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: book.status as Book['status'], // Cast to ensure correct type
      created_at: new Date(book.created_at),
      updated_at: new Date(book.updated_at)
    };
  } catch (error) {
    console.error('Book creation failed:', error);
    throw error;
  }
};
