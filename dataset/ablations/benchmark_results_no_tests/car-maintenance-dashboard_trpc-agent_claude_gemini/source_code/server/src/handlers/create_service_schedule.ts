import { db } from '../db';
import { serviceSchedulesTable, carsTable } from '../db/schema';
import { type CreateServiceScheduleInput, type ServiceSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const createServiceSchedule = async (input: CreateServiceScheduleInput): Promise<ServiceSchedule> => {
  try {
    // First verify that the car exists
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (cars.length === 0) {
      throw new Error(`Car with id ${input.car_id} not found`);
    }

    const car = cars[0];

    // Calculate next service date and mileage based on interval type
    let nextServiceDate: Date | null = null;
    let nextServiceMileage: number | null = null;

    if (input.interval_type === 'time') {
      // Calculate next service date based on last service date + interval (months)
      if (input.last_service_date) {
        nextServiceDate = new Date(input.last_service_date);
        nextServiceDate.setMonth(nextServiceDate.getMonth() + input.interval_value);
      }
    } else if (input.interval_type === 'mileage') {
      // Calculate next service mileage based on last service mileage + interval (miles)
      if (input.last_service_mileage !== null) {
        nextServiceMileage = input.last_service_mileage + input.interval_value;
      }
    }

    // Insert service schedule record
    const result = await db.insert(serviceSchedulesTable)
      .values({
        car_id: input.car_id,
        service_type: input.service_type,
        interval_type: input.interval_type,
        interval_value: input.interval_value,
        last_service_date: input.last_service_date,
        last_service_mileage: input.last_service_mileage,
        next_service_date: nextServiceDate,
        next_service_mileage: nextServiceMileage,
        is_active: true
      })
      .returning()
      .execute();

    const schedule = result[0];
    return schedule;
  } catch (error) {
    console.error('Service schedule creation failed:', error);
    throw error;
  }
};
