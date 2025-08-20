import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserProfile = async (input: UpdateUserProfileInput): Promise<UserProfile | null> => {
  try {
    // Extract id from input for where clause
    const { id, ...updateData } = input;

    // Only update fields that are provided (not undefined)
    const fieldsToUpdate: any = {};
    
    if (updateData.name !== undefined) {
      fieldsToUpdate.name = updateData.name;
    }
    
    if (updateData.bio !== undefined) {
      fieldsToUpdate.bio = updateData.bio;
    }
    
    if (updateData.skill_level !== undefined) {
      fieldsToUpdate.skill_level = updateData.skill_level;
    }
    
    if (updateData.location !== undefined) {
      fieldsToUpdate.location = updateData.location;
    }

    // If no fields to update, return null
    if (Object.keys(fieldsToUpdate).length === 0) {
      return null;
    }

    // Add updated_at timestamp
    fieldsToUpdate.updated_at = new Date();

    // Update the user profile
    const result = await db.update(userProfilesTable)
      .set(fieldsToUpdate)
      .where(eq(userProfilesTable.id, id))
      .returning()
      .execute();

    // Return the updated profile or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};
