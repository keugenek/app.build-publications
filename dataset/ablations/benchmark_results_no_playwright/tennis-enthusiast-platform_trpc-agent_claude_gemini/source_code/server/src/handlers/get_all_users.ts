import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UserProfile } from '../schema';

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const results = await db.select()
      .from(userProfilesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
};
