import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UserProfile } from '../schema';

export const createUserProfile = async (input: CreateUserProfileInput): Promise<UserProfile> => {
  try {
    // Insert user profile record
    const result = await db.insert(userProfilesTable)
      .values({
        name: input.name,
        skill_level: input.skill_level,
        location: input.location
      })
      .returning()
      .execute();

    // Return the created user profile
    const userProfile = result[0];
    return userProfile;
  } catch (error) {
    console.error('User profile creation failed:', error);
    throw error;
  }
};
