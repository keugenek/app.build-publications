import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
  try {
    // Build the update data object with only provided fields
    const updateData: Partial<typeof playersTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.skill_level !== undefined) {
      updateData.skill_level = input.skill_level;
    }
    
    if (input.city !== undefined) {
      updateData.city = input.city;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();
    
    // Perform the update operation
    const result = await db.update(playersTable)
      .set(updateData)
      .where(eq(playersTable.id, input.id))
      .returning()
      .execute();
    
    // Check if any row was updated
    if (result.length === 0) {
      throw new Error(`No player found with id ${input.id}`);
    }
    
    // Return the updated player profile
    const updatedPlayer = result[0];
    return {
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      skill_level: updatedPlayer.skill_level,
      city: updatedPlayer.city,
      created_at: updatedPlayer.created_at
    };
  } catch (error) {
    console.error('Profile update failed:', error);
    throw error;
  }
};
