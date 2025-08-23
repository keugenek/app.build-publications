import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UserProfile } from '../schema';

export const createProfile = async (input: CreateUserProfileInput): Promise<UserProfile> => {
  try {
    // Insert user profile record
    const result = await db.insert(userProfilesTable)
      .values({
        name: input.name,
        email: input.email,
        skill_level: input.skill_level,
        location: input.location,
        bio: input.bio || null
      })
      .returning()
      .execute();

    const profile = result[0];
    return {
      ...profile,
      created_at: new Date(profile.created_at),
      updated_at: new Date(profile.updated_at)
    };
  } catch (error) {
    console.error('User profile creation failed:', error);
    throw error;
  }
};
