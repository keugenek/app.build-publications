import { type Booking } from '../schema';
import { db } from '../db';
import { bookingsTable } from '../db/schema';

/**
 * Placeholder handler to fetch all bookings.
 */
export const getBookings = async (): Promise<Booking[]> => {
  const result = await db
  .select()
  .from(bookingsTable)
  .execute();

  // Return the fetched bookings as is – dates are already Date objects
  return result;
};
