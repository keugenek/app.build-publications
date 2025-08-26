import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type Folder } from '../schema';

/**
 * Fetch all folders from the database.
 * In a real application this would likely be filtered by `user_id`, but for the
 * minimal implementation we simply return every folder record.
 */
export const getFolders = async (): Promise<Folder[]> => {
  try {
    const rows = await db.select().from(foldersTable).execute();
    // Drizzle already returns proper types for the columns (e.g., Date for timestamps)
    // but we map explicitly to satisfy the Folder type definition.
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      user_id: row.user_id,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    throw error;
  }
};
