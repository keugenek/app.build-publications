import { type CreateBookInput, type Book } from '../schema';
import { db } from '../db';
import { booksTable } from '../db/schema';

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  // Insert the new book into the database
  const result = await db.insert(booksTable).values({
    title: input.title,
    author: input.author,
    genre: input.genre,
    status: input.status,
  }).returning();
  
  // Return the inserted book
  return result[0];
};
