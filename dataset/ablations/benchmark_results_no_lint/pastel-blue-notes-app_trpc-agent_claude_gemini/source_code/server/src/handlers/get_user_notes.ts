import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetUserNotesInput, type Note } from '../schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getUserNotes = async (input: GetUserNotesInput): Promise<Note[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(notesTable.user_id, input.user_id));
    
    // Add category filter if provided
    if (input.category_id !== undefined) {
      if (input.category_id === null) {
        conditions.push(isNull(notesTable.category_id));
      } else {
        conditions.push(eq(notesTable.category_id, input.category_id));
      }
    }

    // Build the query with all conditions and ordering
    const query = db.select()
      .from(notesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(notesTable.updated_at));

    const results = await query.execute();

    // Return results - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Get user notes failed:', error);
    throw error;
  }
};
