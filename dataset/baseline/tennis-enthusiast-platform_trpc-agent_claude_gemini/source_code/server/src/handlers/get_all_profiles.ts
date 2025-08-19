import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UserProfile } from '../schema';

export const getAllProfiles = async (): Promise<UserProfile[]> => {
  try {
    // Query all user profiles from the database
    const results = await db.select()
      .from(userProfilesTable)
      .execute();

    // Return the profiles (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to get all profiles:', error);
    throw error;
  }
};
