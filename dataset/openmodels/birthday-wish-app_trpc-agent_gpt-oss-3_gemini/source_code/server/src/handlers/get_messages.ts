import { type Message } from '../schema';
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { desc } from 'drizzle-orm';

/**
 * Fetch all birthday messages ordered by creation date descending.
 * Returns an array of Message objects.
 */
export const getMessages = async (): Promise<Message[]> => {
  try {
    // Build query to fetch all messages ordered by creation date descending
    const results = await db.select()
      .from(messagesTable)
      .orderBy(desc(messagesTable.created_at))
      .execute();

    // Return results typed as Message[]
    return results as Message[];
  } catch (error) {
    console.error('Failed to get messages:', error);
    throw error;
  }
};

// Note: The original implementation had a misplaced brace and lacked proper typing.
// The function now correctly builds the query, executes it, and returns the typed results.
