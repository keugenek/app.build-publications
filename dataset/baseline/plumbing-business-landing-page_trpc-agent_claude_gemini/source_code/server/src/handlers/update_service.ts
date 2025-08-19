import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type UpdateServiceInput, type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const updateService = async (input: UpdateServiceInput): Promise<Service> => {
  try {
    // First, check if the service exists
    const existingService = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.id))
      .execute();

    if (existingService.length === 0) {
      throw new Error(`Service with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.icon !== undefined) {
      updateData.icon = input.icon;
    }
    if (input.price_range !== undefined) {
      updateData.price_range = input.price_range;
    }
    if (input.is_featured !== undefined) {
      updateData.is_featured = input.is_featured;
    }
    if (input.display_order !== undefined) {
      updateData.display_order = input.display_order;
    }

    // If no fields to update, return the existing service
    if (Object.keys(updateData).length === 0) {
      return existingService[0];
    }

    // Update the service record
    const result = await db.update(servicesTable)
      .set(updateData)
      .where(eq(servicesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Service update failed:', error);
    throw error;
  }
};
