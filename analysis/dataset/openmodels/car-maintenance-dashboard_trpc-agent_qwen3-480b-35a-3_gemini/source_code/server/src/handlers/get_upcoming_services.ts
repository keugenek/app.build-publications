import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type UpcomingService } from '../schema';
import { desc, inArray, eq } from 'drizzle-orm';

export const getUpcomingServices = async (): Promise<UpcomingService[]> => {
  try {
    // First, get all cars that have maintenance entries
    const carsWithMaintenanceResult = await db.selectDistinct({
      car_id: carsTable.id
    })
    .from(carsTable)
    .innerJoin(maintenanceEntriesTable, eq(carsTable.id, maintenanceEntriesTable.car_id))
    .execute();

    if (carsWithMaintenanceResult.length === 0) {
      return [];
    }

    const carIds = carsWithMaintenanceResult.map(result => result.car_id);
    
    // Get the latest maintenance entry for each service type for each car
    // We'll do this by querying all entries and then filtering in JavaScript
    // since DISTINCT ON is PostgreSQL-specific and not directly supported by Drizzle
    const allEntries = await db.select({
      id: maintenanceEntriesTable.id,
      car_id: maintenanceEntriesTable.car_id,
      date: maintenanceEntriesTable.date,
      service_type: maintenanceEntriesTable.service_type,
      mileage_at_service: maintenanceEntriesTable.mileage_at_service
    })
    .from(maintenanceEntriesTable)
    .where(inArray(maintenanceEntriesTable.car_id, carIds))
    .orderBy(desc(maintenanceEntriesTable.date))
    .execute();

    // Group entries by car_id and service_type, keeping only the latest for each
    const latestEntriesMap = new Map<string, typeof allEntries[0]>();
    
    for (const entry of allEntries) {
      const key = `${entry.car_id}-${entry.service_type}`;
      if (!latestEntriesMap.has(key)) {
        latestEntriesMap.set(key, entry);
      }
    }
    
    const latestEntries = Array.from(latestEntriesMap.values());
    
    // Get car details for cars with maintenance
    const carsResult = await db.select({
      id: carsTable.id,
      make: carsTable.make,
      model: carsTable.model,
      vin: carsTable.vin,
      current_mileage: carsTable.current_mileage
    })
    .from(carsTable)
    .where(inArray(carsTable.id, carIds))
    .execute();

    // Create a map of car details for easy lookup
    const carDetailsMap = new Map(carsResult.map(car => [car.id, car]));

    // Transform the results into UpcomingService objects
    const upcomingServices: UpcomingService[] = latestEntries.map(entry => {
      const carDetails = carDetailsMap.get(entry.car_id);
      
      if (!carDetails) {
        throw new Error(`Car details not found for car_id: ${entry.car_id}`);
      }

      // Calculate next service date (6 months from last service)
      const lastServiceDate = new Date(entry.date);
      const nextServiceDate = new Date(lastServiceDate);
      nextServiceDate.setMonth(nextServiceDate.getMonth() + 6);
      
      // Ensure the date is not in the past
      const today = new Date();
      const predictedDate = nextServiceDate > today ? nextServiceDate : today;
      
      // Calculate next service mileage (current mileage + 5000)
      // This ensures it's always greater than current mileage
      const predictedMileage = carDetails.current_mileage + 5000;
      
      return {
        car_id: entry.car_id,
        make: carDetails.make,
        model: carDetails.model,
        vin: carDetails.vin,
        next_service_date: predictedDate,
        next_service_mileage: predictedMileage,
        service_type: entry.service_type
      };
    });

    return upcomingServices;
  } catch (error) {
    console.error('Failed to fetch upcoming services:', error);
    throw error;
  }
};
