import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UserProfile } from '../schema';

export const getPlayers = async (): Promise<UserProfile[]> => {
  try {
    const players = await db.select({
      id: playersTable.id,
      name: playersTable.name,
      skill_level: playersTable.skill_level,
      city: playersTable.city,
      created_at: playersTable.created_at
    }).from(playersTable).execute();
    
    return players;
  } catch (error) {
    console.error('Failed to fetch players:', error);
    throw error;
  }
};
