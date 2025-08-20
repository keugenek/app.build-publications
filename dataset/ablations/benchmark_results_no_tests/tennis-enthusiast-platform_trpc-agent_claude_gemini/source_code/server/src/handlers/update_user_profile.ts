import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
  try {
    // First check if the user profile exists
    const existingProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.id))
      .execute();

    if (existingProfile.length === 0) {
      throw new Error(`User profile with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      skill_level: 'Beginner' | 'Intermediate' | 'Advanced';
      city: string;
      state: string;
      bio: string;
    }> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.skill_level !== undefined) {
      updateData.skill_level = input.skill_level;
    }
    if (input.city !== undefined) {
      updateData.city = input.city;
    }
    if (input.state !== undefined) {
      updateData.state = input.state;
    }
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }

    // If no fields to update, return the existing profile
    if (Object.keys(updateData).length === 0) {
      return existingProfile[0];
    }

    // Update the profile
    const result = await db.update(userProfilesTable)
      .set(updateData)
      .where(eq(userProfilesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};
