import { type CreateUserInput, type User } from '../schema';
import { db } from '../db';
import { usersTable } from '../db/schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert new user record into the users table
    const result = await db
      .insert(usersTable)
      .values({
        username: input.username,
        skill_level: input.skill_level,
        location: input.location,
        // If profile_picture_url is undefined, we omit the field so DB uses NULL
        ...(input.profile_picture_url !== undefined && { profile_picture_url: input.profile_picture_url })
      })
      .returning()
      .execute();

    const user = result[0];
    // Drizzle returns timestamps as Date objects already, but ensure type consistency
    return {
      id: user.id,
      username: user.username,
      skill_level: user.skill_level,
      location: user.location,
      profile_picture_url: user.profile_picture_url ?? null,
      created_at: user.created_at
    } as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
  return {
    id: 0, // placeholder ID
    username: input.username,
    skill_level: input.skill_level,
    location: input.location,
    profile_picture_url: input.profile_picture_url ?? null,
    created_at: new Date(),
  } as User;
};
