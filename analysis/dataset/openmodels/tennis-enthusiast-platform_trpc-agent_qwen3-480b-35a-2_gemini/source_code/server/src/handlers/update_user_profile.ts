import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
  try {
    // First, check if the user profile exists
    const existingProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.id))
      .execute();

    if (existingProfile.length === 0) {
      throw new Error(`User profile with id ${input.id} not found`);
    }

    // Build update data object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    
    if (input.skill_level !== undefined) {
      updateData.skill_level = input.skill_level;
    }
    
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }

    // Update profile in database
    const result = await db.update(userProfilesTable)
      .set(updateData)
      .where(eq(userProfilesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update user profile with id ${input.id}`);
    }

    // Return the updated profile
    return {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      skill_level: result[0].skill_level,
      location: result[0].location,
      bio: result[0].bio,
      created_at: result[0].created_at,
      updated_at: result[0].updated_at
    };
  } catch (error) {
    console.error('Profile update failed:', error);
    throw error;
  }
};
