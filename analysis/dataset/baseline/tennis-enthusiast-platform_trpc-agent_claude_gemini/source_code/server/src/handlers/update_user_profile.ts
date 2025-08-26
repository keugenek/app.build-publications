import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserProfile = async (input: UpdateUserProfileInput): Promise<UserProfile | null> => {
  try {
    // Build update object with only provided fields
    const updateFields: Record<string, any> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateFields['name'] = input.name;
    }

    if (input.skill_level !== undefined) {
      updateFields['skill_level'] = input.skill_level;
    }

    if (input.location !== undefined) {
      updateFields['location'] = input.location;
    }

    // Update the user profile and return the updated record
    const result = await db.update(userProfilesTable)
      .set(updateFields)
      .where(eq(userProfilesTable.id, input.id))
      .returning()
      .execute();

    // Return null if no record was found/updated
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};
