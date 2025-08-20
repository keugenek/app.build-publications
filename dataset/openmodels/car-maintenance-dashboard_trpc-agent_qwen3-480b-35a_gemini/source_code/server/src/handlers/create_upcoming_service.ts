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
        due_date: input.due_date ? input.due_date.toISOString().split('T')[0] : null,
        due_mileage: input.due_mileage || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert the result back to the expected format
    const service = result[0];
    return {
      ...service,
      due_date: service.due_date ? new Date(service.due_date) : null
    };
  } catch (error) {
    console.error('Upcoming service creation failed:', error);
    throw error;
  }
};
