import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBook = async (input: UpdateBookInput): Promise<Book> => {
  try {
    // Build update data object with only provided fields
    const updateData: Partial<typeof booksTable.$inferInsert> = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.author !== undefined) updateData.author = input.author;
    if (input.genre !== undefined) updateData.genre = input.genre;
    if (input.status !== undefined) updateData.status = input.status;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update book record
    const result = await db.update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Book with id ${input.id} not found`);
    }

    // Return the updated book
    return {
      id: result[0].id,
      title: result[0].title,
      author: result[0].author,
      genre: result[0].genre,
      status: result[0].status as 'Read' | 'Unread' | 'Reading',
      created_at: result[0].created_at,
      updated_at: result[0].updated_at
    };
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};
