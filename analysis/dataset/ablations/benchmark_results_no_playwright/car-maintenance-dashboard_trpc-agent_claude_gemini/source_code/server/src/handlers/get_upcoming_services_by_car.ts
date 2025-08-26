import { db } from '../db';
import { upcomingServicesTable, carsTable } from '../db/schema';
import { type GetUpcomingServicesByCarInput, type UpcomingService } from '../schema';
import { eq } from 'drizzle-orm';

export const getUpcomingServicesByCarId = async (input: GetUpcomingServicesByCarInput): Promise<UpcomingService[]> => {
  try {
    // First verify that the car exists
    const car = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (car.length === 0) {
      throw new Error(`Car with id ${input.car_id} not found`);
    }

    // Get all upcoming services for the specified car
    const results = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.car_id, input.car_id))
      .execute();

    // No numeric conversions needed since all fields are already proper types
    // (cost is not in upcoming services table, all other fields are integers, booleans, strings, or dates)
    return results;
  } catch (error) {
    console.error('Failed to get upcoming services by car:', error);
    throw error;
  }
};
