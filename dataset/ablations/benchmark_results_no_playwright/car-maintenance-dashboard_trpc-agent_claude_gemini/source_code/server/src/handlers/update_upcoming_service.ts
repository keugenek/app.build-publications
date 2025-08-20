import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { type UpdateUpcomingServiceInput, type UpcomingService } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUpcomingService = async (input: UpdateUpcomingServiceInput): Promise<UpcomingService> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.car_id !== undefined) updateData.car_id = input.car_id;
    if (input.service_type !== undefined) updateData.service_type = input.service_type;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;
    if (input.due_mileage !== undefined) updateData.due_mileage = input.due_mileage;
    if (input.is_completed !== undefined) updateData.is_completed = input.is_completed;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Update the upcoming service record
    const result = await db
      .update(upcomingServicesTable)
      .set(updateData)
      .where(eq(upcomingServicesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Upcoming service not found');
    }

    // Return the updated upcoming service
    const upcomingService = result[0];
    return upcomingService;
  } catch (error) {
    console.error('Upcoming service update failed:', error);
    throw error;
  }
};
