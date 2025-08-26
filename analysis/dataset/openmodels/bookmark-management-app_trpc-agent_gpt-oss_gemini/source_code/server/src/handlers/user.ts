import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

/**
 * Creates a new user in the database.
 * In a real implementation the password would be hashed before being stored.
 * For the purpose of this exercise we store the raw password as `password_hash`.
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash: input.password, // placeholder hashing
      })
      .returning()
      .execute();

    const user = result[0];
    // Ensure the returned object matches the User schema shape
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
    } as User;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

/**
 * Retrieves all users from the database.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const rows = await db.select().from(usersTable).execute();
    // Rows already conform to the User type (id, email, password_hash, created_at)
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      created_at: row.created_at,
    } as User));
  } catch (error) {
    console.error('Fetching users failed:', error);
    throw error;
  }
};
