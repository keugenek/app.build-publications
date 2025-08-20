import { db } from '../db';
import { serviceSchedulesTable, carsTable } from '../db/schema';
import { type UpdateServiceScheduleInput, type ServiceSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const updateServiceSchedule = async (input: UpdateServiceScheduleInput): Promise<ServiceSchedule> => {
  try {
    // First verify the service schedule exists
    const existingSchedule = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.id, input.id))
      .limit(1)
      .execute();

    if (existingSchedule.length === 0) {
      throw new Error('Service schedule not found');
    }

    const current = existingSchedule[0];

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.service_type !== undefined) {
      updateData.service_type = input.service_type;
    }

    if (input.interval_type !== undefined) {
      updateData.interval_type = input.interval_type;
    }

    if (input.interval_value !== undefined) {
      updateData.interval_value = input.interval_value;
    }

    if (input.last_service_date !== undefined) {
      updateData.last_service_date = input.last_service_date;
    }

    if (input.last_service_mileage !== undefined) {
      updateData.last_service_mileage = input.last_service_mileage;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Recalculate next service dates/mileage if relevant data changed
    const intervalType = input.interval_type ?? current.interval_type;
    const intervalValue = input.interval_value ?? current.interval_value;
    const lastServiceDate = input.last_service_date !== undefined ? input.last_service_date : current.last_service_date;
    const lastServiceMileage = input.last_service_mileage !== undefined ? input.last_service_mileage : current.last_service_mileage;

    // Calculate next service date for time-based intervals
    if (intervalType === 'time' && lastServiceDate) {
      const nextDate = new Date(lastServiceDate);
      nextDate.setMonth(nextDate.getMonth() + intervalValue);
      updateData.next_service_date = nextDate;
    } else if (intervalType === 'time') {
      updateData.next_service_date = null;
    }

    // Calculate next service mileage for mileage-based intervals
    if (intervalType === 'mileage' && lastServiceMileage !== null) {
      updateData.next_service_mileage = lastServiceMileage + intervalValue;
    } else if (intervalType === 'mileage') {
      updateData.next_service_mileage = null;
    }

    // If interval type changed, clear the irrelevant next service field
    if (intervalType === 'time') {
      updateData.next_service_mileage = null;
    } else if (intervalType === 'mileage') {
      updateData.next_service_date = null;
    }

    // Update the service schedule
    const result = await db.update(serviceSchedulesTable)
      .set(updateData)
      .where(eq(serviceSchedulesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Service schedule update failed:', error);
    throw error;
  }
};
