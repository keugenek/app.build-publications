import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type GetUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserProfile = async (input: GetUserProfileInput): Promise<UserProfile | null> => {
  try {
    // Query the database for a user profile by ID
    const results = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.id))
      .execute();

    // Return the first result if found, otherwise null
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get user profile failed:', error);
    throw error;
  }
};
