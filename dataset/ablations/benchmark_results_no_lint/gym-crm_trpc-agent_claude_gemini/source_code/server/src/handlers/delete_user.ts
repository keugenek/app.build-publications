import { db } from '../db';
import { usersTable, bookingsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(input: DeleteEntityInput): Promise<{ success: boolean }> {
  try {
    // First, cancel any confirmed bookings for this user
    await db.update(bookingsTable)
      .set({ 
        booking_status: 'cancelled',
        cancelled_at: new Date()
      })
      .where(eq(bookingsTable.user_id, input.id))
      .execute();

    // Delete the user - this will cascade delete instructor records and bookings
    // due to the foreign key constraints with onDelete: 'cascade'
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    // Check if user was actually deleted
    const success = result.rowCount !== null && result.rowCount > 0;
    
    return { success };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}
