import { db } from '../db';
import { serviceSchedulesTable, carsTable } from '../db/schema';
import { type GetServiceSchedulesByCarInput, type ServiceSchedule } from '../schema';
import { eq, and, asc, SQL } from 'drizzle-orm';

export async function getServiceSchedulesByCarId(input: GetServiceSchedulesByCarInput): Promise<ServiceSchedule[]> {
  try {
    // First, get the car's current mileage to calculate next service dates
    const car = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.carId))
      .execute();

    if (car.length === 0) {
      throw new Error(`Car with ID ${input.carId} not found`);
    }

    const currentMileage = car[0].current_mileage;
    const currentDate = new Date();

    // Get all active service schedules for the car
    const schedules = await db.select()
      .from(serviceSchedulesTable)
      .where(
        and(
          eq(serviceSchedulesTable.car_id, input.carId),
          eq(serviceSchedulesTable.is_active, true)
        )
      )
      .orderBy(asc(serviceSchedulesTable.service_type))
      .execute();

    // Recalculate next service dates/mileage for each schedule
    const recalculatedSchedules = schedules.map(schedule => {
      let nextServiceDate: Date | null = null;
      let nextServiceMileage: number | null = null;

      if (schedule.interval_type === 'time') {
        // Calculate next service date based on time interval (months)
        if (schedule.last_service_date) {
          const lastDate = new Date(schedule.last_service_date);
          nextServiceDate = new Date(lastDate);
          nextServiceDate.setMonth(nextServiceDate.getMonth() + schedule.interval_value);
        } else {
          // If no last service date, use current date plus interval
          nextServiceDate = new Date(currentDate);
          nextServiceDate.setMonth(nextServiceDate.getMonth() + schedule.interval_value);
        }
      } else if (schedule.interval_type === 'mileage') {
        // Calculate next service mileage based on mileage interval
        if (schedule.last_service_mileage !== null) {
          nextServiceMileage = schedule.last_service_mileage + schedule.interval_value;
        } else {
          // If no last service mileage, use current mileage plus interval
          nextServiceMileage = currentMileage + schedule.interval_value;
        }
      }

      return {
        id: schedule.id,
        car_id: schedule.car_id,
        service_type: schedule.service_type,
        interval_type: schedule.interval_type,
        interval_value: schedule.interval_value,
        last_service_date: schedule.last_service_date,
        last_service_mileage: schedule.last_service_mileage,
        next_service_date: nextServiceDate,
        next_service_mileage: nextServiceMileage,
        is_active: schedule.is_active,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      };
    });

    // Sort by priority: overdue services first, then by next service date/mileage
    const sortedSchedules = recalculatedSchedules.sort((a, b) => {
      // Check if services are overdue
      const aOverdue = isOverdue(a, currentDate, currentMileage);
      const bOverdue = isOverdue(b, currentDate, currentMileage);

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // If both overdue or both not overdue, sort by next service date/mileage
      if (a.interval_type === 'time' && b.interval_type === 'time') {
        if (a.next_service_date && b.next_service_date) {
          return a.next_service_date.getTime() - b.next_service_date.getTime();
        }
        return a.next_service_date ? -1 : 1;
      } else if (a.interval_type === 'mileage' && b.interval_type === 'mileage') {
        if (a.next_service_mileage !== null && b.next_service_mileage !== null) {
          return a.next_service_mileage - b.next_service_mileage;
        }
        return a.next_service_mileage !== null ? -1 : 1;
      } else {
        // Mixed types: prioritize overdue mileage services, then time services
        return a.interval_type === 'mileage' ? -1 : 1;
      }
    });

    return sortedSchedules;
  } catch (error) {
    console.error('Failed to get service schedules by car:', error);
    throw error;
  }
}

// Helper function to determine if a service is overdue
function isOverdue(schedule: ServiceSchedule, currentDate: Date, currentMileage: number): boolean {
  if (schedule.interval_type === 'time' && schedule.next_service_date) {
    return currentDate > schedule.next_service_date;
  } else if (schedule.interval_type === 'mileage' && schedule.next_service_mileage !== null) {
    return currentMileage >= schedule.next_service_mileage;
  }
  return false;
}
