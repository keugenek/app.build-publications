import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UserProfile } from '../schema';

export const createUserProfile = async (input: CreateUserProfileInput): Promise<UserProfile> => {
  try {
    // Insert user profile record
    const result = await db.insert(userProfilesTable)
      .values({
        name: input.name,
        bio: input.bio,
        skill_level: input.skill_level,
        location: input.location
      })
      .returning()
      .execute();

    // Return the created profile (no numeric conversions needed for this table)
    return result[0];
  } catch (error) {
    console.error('User profile creation failed:', error);
    throw error;
  }
};
