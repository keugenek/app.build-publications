import { type CreateUserInput, type User } from '../schema';
import { db } from '../db';
import { users } from '../db/schema';

/**
 * Handler for creating a new user profile.
 * Inserts the user into the database and returns the created record.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user into database. bio defaults to null if omitted.
    const result = await db
      .insert(users)
      .values({
        name: input.name,
        bio: input.bio ?? null,
        skill_level: input.skill_level,
        city: input.city,
        state: input.state,
      })
      .returning()
      .execute();

    // Drizzle returns an array with the inserted row.
    const user = result[0];
    return user as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
