import { db } from '../db';
import { playersTable } from '../db/schema';
import { type SearchPlayersInput, type UserProfile } from '../schema';
import { and, eq } from 'drizzle-orm';

export const searchPlayers = async (input: SearchPlayersInput): Promise<UserProfile[]> => {
  try {
    // Build conditions array
    const conditions = [];

    // Add skill level filter if provided
    if (input.skill_level) {
      conditions.push(eq(playersTable.skill_level, input.skill_level));
    }

    // Add city filter if provided
    if (input.city) {
      conditions.push(eq(playersTable.city, input.city));
    }

    // Execute query with filters
    let results;
    if (conditions.length > 0) {
      results = await db.select({
        id: playersTable.id,
        name: playersTable.name,
        skill_level: playersTable.skill_level,
        city: playersTable.city,
        created_at: playersTable.created_at,
      })
      .from(playersTable)
      .where(and(...conditions))
      .execute();
    } else {
      results = await db.select({
        id: playersTable.id,
        name: playersTable.name,
        skill_level: playersTable.skill_level,
        city: playersTable.city,
        created_at: playersTable.created_at,
      })
      .from(playersTable)
      .execute();
    }

    // Map results to UserProfile format
    return results.map(player => ({
      id: player.id,
      name: player.name,
      skill_level: player.skill_level,
      city: player.city,
      created_at: player.created_at
    }));
  } catch (error) {
    console.error('Search players failed:', error);
    throw error;
  }
};
