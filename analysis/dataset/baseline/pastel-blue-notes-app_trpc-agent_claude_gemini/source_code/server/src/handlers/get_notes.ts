import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq, and, desc, SQL } from 'drizzle-orm';

export const getNotes = async (userId: number, categoryId?: number): Promise<Note[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [eq(notesTable.user_id, userId)];

    // Add category filter if provided
    if (categoryId !== undefined) {
      conditions.push(eq(notesTable.category_id, categoryId));
    }

    // Build and execute query with proper chaining
    const results = await db.select()
      .from(notesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(notesTable.updated_at))
      .execute();

    // Return notes with proper date conversion
    return results.map(note => ({
      ...note,
      created_at: new Date(note.created_at),
      updated_at: new Date(note.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get notes:', error);
    throw error;
  }
};
