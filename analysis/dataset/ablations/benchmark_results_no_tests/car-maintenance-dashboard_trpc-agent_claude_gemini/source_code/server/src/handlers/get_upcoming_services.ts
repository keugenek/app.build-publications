import { db } from '../db';
import { serviceSchedulesTable, carsTable } from '../db/schema';
import { type ServiceSchedule } from '../schema';
import { eq, and, or, lte, isNotNull, asc } from 'drizzle-orm';

export async function getUpcomingServices(): Promise<ServiceSchedule[]> {
  try {
    // Calculate threshold dates and mileage
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Get all active service schedules with car information
    const results = await db.select({
      id: serviceSchedulesTable.id,
      car_id: serviceSchedulesTable.car_id,
      service_type: serviceSchedulesTable.service_type,
      interval_type: serviceSchedulesTable.interval_type,
      interval_value: serviceSchedulesTable.interval_value,
      last_service_date: serviceSchedulesTable.last_service_date,
      last_service_mileage: serviceSchedulesTable.last_service_mileage,
      next_service_date: serviceSchedulesTable.next_service_date,
      next_service_mileage: serviceSchedulesTable.next_service_mileage,
      is_active: serviceSchedulesTable.is_active,
      created_at: serviceSchedulesTable.created_at,
      updated_at: serviceSchedulesTable.updated_at,
      current_mileage: carsTable.current_mileage
    })
    .from(serviceSchedulesTable)
    .innerJoin(carsTable, eq(serviceSchedulesTable.car_id, carsTable.id))
    .where(eq(serviceSchedulesTable.is_active, true))
    .execute();

    // Filter and process results for upcoming services
    const upcomingServices = results
      .filter(schedule => {
        // Check if service is due based on date or mileage
        let isDueByDate = false;
        let isDueByMileage = false;

        // Check date-based scheduling
        if (schedule.interval_type === 'time' && schedule.next_service_date) {
          isDueByDate = schedule.next_service_date <= thirtyDaysFromNow;
        }

        // Check mileage-based scheduling
        if (schedule.interval_type === 'mileage' && 
            schedule.next_service_mileage !== null && 
            schedule.current_mileage !== null) {
          const milesRemaining = schedule.next_service_mileage - schedule.current_mileage;
          isDueByMileage = milesRemaining <= 1000;
        }

        return isDueByDate || isDueByMileage;
      })
      .map(schedule => ({
        id: schedule.id,
        car_id: schedule.car_id,
        service_type: schedule.service_type,
        interval_type: schedule.interval_type,
        interval_value: schedule.interval_value,
        last_service_date: schedule.last_service_date,
        last_service_mileage: schedule.last_service_mileage,
        next_service_date: schedule.next_service_date,
        next_service_mileage: schedule.next_service_mileage,
        is_active: schedule.is_active,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at
      }))
      .sort((a, b) => {
        // Sort by urgency - earliest date or lowest mileage remaining first
        if (a.interval_type === 'time' && b.interval_type === 'time') {
          if (!a.next_service_date || !b.next_service_date) return 0;
          return a.next_service_date.getTime() - b.next_service_date.getTime();
        }
        
        if (a.interval_type === 'mileage' && b.interval_type === 'mileage') {
          if (a.next_service_mileage === null || b.next_service_mileage === null) return 0;
          return a.next_service_mileage - b.next_service_mileage;
        }

        // Mixed types - prioritize by which is more urgent
        if (a.interval_type === 'time') return -1;
        return 1;
      });

    return upcomingServices;
  } catch (error) {
    console.error('Failed to get upcoming services:', error);
    throw error;
  }
}
