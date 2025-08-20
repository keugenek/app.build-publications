import { db } from '../db';
import { upcomingServicesTable } from '../db/schema';
import { type UpdateUpcomingServiceInput, type UpcomingService } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUpcomingService = async (input: UpdateUpcomingServiceInput): Promise<UpcomingService | null> => {
  try {
    const { id, ...updateData } = input;
    
    // Remove undefined fields from update data
    const filteredUpdateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        filteredUpdateData[key] = value;
      }
    }
    
    // If no fields to update, return null
    if (Object.keys(filteredUpdateData).length === 0) {
      return null;
    }
    
    const result = await db.update(upcomingServicesTable)
      .set(filteredUpdateData)
      .where(eq(upcomingServicesTable.id, id))
      .returning()
      .execute();
    
    if (result.length === 0) {
      return null;
    }
    
    const updatedService = result[0];
    return {
      ...updatedService,
      due_date: updatedService.due_date ? new Date(updatedService.due_date) : null,
      created_at: new Date(updatedService.created_at)
    };
  } catch (error) {
    console.error('Failed to update upcoming service:', error);
    throw error;
  }
};
