import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserProfile = async (userId: number): Promise<UserProfile | null> => {
  try {
    // Query user profile by ID
    const results = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .execute();

    // Return null if user not found
    if (results.length === 0) {
      return null;
    }

    // Return the user profile
    return results[0];
  } catch (error) {
    console.error('Get user profile failed:', error);
    throw error;
  }
};
