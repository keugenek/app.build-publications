import { type CreateUserInput, type User } from '../schema';
import { db } from '../db';
import { usersTable } from '../db/schema';


/**
 * Creates a new user record in the database.
 *
 * The function inserts the provided user data into the `users` table and returns the
 * newly created user, including the generated `id` and `created_at` timestamp.
 *
 * All fields are directly inserted because there are no numeric columns that require
 * special string/number conversion.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({
        name: input.name,
        skill_level: input.skill_level,
        location: input.location,
      })
      .returning()
      .execute();

    // Drizzle returns an array with the inserted rows; we expect exactly one.
    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      skill_level: user.skill_level,
      location: user.location,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
