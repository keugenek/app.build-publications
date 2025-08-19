import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .execute();

    // Convert the database results to match the User schema
    return results.map(user => ({
      ...user,
      // Ensure dates are properly handled
      date_of_birth: user.date_of_birth || null,
      membership_start_date: user.membership_start_date || null,
      membership_end_date: user.membership_end_date || null,
      phone: user.phone || null
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
