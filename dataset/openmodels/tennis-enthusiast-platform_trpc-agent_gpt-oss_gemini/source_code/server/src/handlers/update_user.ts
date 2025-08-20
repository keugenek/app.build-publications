import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';

/**
 * Update an existing user record.
 * Fields that are undefined in the input are ignored.
 * Returns the updated user as defined by the Zod schema.
 */
export const updateUser = async (update: UpdateUserInput): Promise<User> => {
  try {
    // Build partial update object, excluding undefined values
    const data: Partial<typeof usersTable.$inferInsert> = {};
    if (update.username !== undefined) data.username = update.username;
    if (update.skill_level !== undefined) data.skill_level = update.skill_level;
    if (update.location !== undefined) data.location = update.location;
    if (update.profile_picture_url !== undefined) data.profile_picture_url = update.profile_picture_url;

    // Perform the update and return the updated row
    const result = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, update.id))
      .returning()
      .execute();

    const updated = result[0];
    // Map DB row to Zod User type (created_at is already a Date)
    return {
      id: updated.id,
      username: updated.username,
      skill_level: updated.skill_level,
      location: updated.location,
      profile_picture_url: updated.profile_picture_url ?? null,
      created_at: updated.created_at,
    } as User;
  } catch (error) {
    console.error('Update user failed:', error);
    throw error;
  }
};
