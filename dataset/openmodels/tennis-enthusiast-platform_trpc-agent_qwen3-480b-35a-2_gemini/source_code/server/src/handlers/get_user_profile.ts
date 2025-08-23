import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const getProfile = async (id: number): Promise<UserProfile> => {
  try {
    const result = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, id))
      .execute();

    if (result.length === 0) {
      throw new Error(`User profile with id ${id} not found`);
    }

    const profile = result[0];
    return {
      ...profile,
      created_at: new Date(profile.created_at),
      updated_at: new Date(profile.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
