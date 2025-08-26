import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq, or } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if username or email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(
        or(
          eq(usersTable.username, input.username),
          eq(usersTable.email, input.email)
        )
      )
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      const existingField = existingUser[0].username === input.username ? 'username' : 'email';
      throw new Error(`User with this ${existingField} already exists`);
    }

    // Hash the password with salt
    const salt = randomBytes(16).toString('hex');
    const password_hash = createHash('sha256').update(input.password + salt).digest('hex') + ':' + salt;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: password_hash
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
