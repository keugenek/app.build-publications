import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { type CreateUpcomingServiceInput, type UpcomingService } from '../schema';

export const createUpcomingService = async (input: CreateUpcomingServiceInput): Promise<UpcomingService> => {
  try {
    // Insert upcoming service record
    const result = await db.insert(upcomingServicesTable)
      .values({
        car_id: input.car_id,
        service_type: input.service_type,
        description: input.description,
        due_date: input.due_date,
        due_mileage: input.due_mileage,
        notes: input.notes
        // is_completed defaults to false in the database schema
      })
      .returning()
      .execute();

    // Return the created upcoming service record
    const upcomingService = result[0];
    return upcomingService;
  } catch (error) {
    console.error('Upcoming service creation failed:', error);
    throw error;
  }
};
