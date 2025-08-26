import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreateUserProfileInput, type UserProfile } from '../schema';

export const createProfile = async (input: CreateUserProfileInput): Promise<UserProfile> => {
  try {
    // Generate a unique email based on name and a timestamp
    const email = `${input.name.replace(/\s+/g, '.').toLowerCase()}.${Date.now()}@example.com`;
    
    // Insert player record
    const result = await db.insert(playersTable)
      .values({
        name: input.name,
        email: email,
        skill_level: input.skill_level,
        city: input.city
      })
      .returning()
      .execute();

    const player = result[0];
    
    // Transform to UserProfile type
    return {
      id: player.id,
      name: player.name,
      skill_level: player.skill_level,
      city: player.city,
      created_at: player.created_at
    };
  } catch (error) {
    console.error('Profile creation failed:', error);
    throw error;
  }
};
