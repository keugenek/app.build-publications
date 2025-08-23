import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';

/**
 * Handler to fetch all notes.
 * In a real implementation this would filter by user ID, but for simplicity we
 * return all notes present in the database.
 */
export const getNotes = async (): Promise<Note[]> => {
  try {
    // Fetch all notes from the database
    const notes = await db.select().from(notesTable).execute();
    // Return the raw results – notes contain Date objects already
    return notes;
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
};
