import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';

/** Fetch all notes from the database */
export const getNotes = async (): Promise<Note[]> => {
  try {
    const rows = await db.select().from(notesTable).execute();
    // Drizzle returns proper JS types for timestamps; no numeric conversion needed here
    return rows.map((row) => ({
      ...row,
    }));
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
};
