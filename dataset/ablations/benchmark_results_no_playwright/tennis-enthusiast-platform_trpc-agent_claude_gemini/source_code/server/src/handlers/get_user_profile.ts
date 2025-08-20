import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserProfile = async (userId: number): Promise<UserProfile | null> => {
  try {
    // Query the database for the user profile with the given ID
    const results = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .limit(1)
      .execute();

    // Return null if no user found
    if (results.length === 0) {
      return null;
    }

    // Return the found user profile
    const userProfile = results[0];
    return userProfile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
