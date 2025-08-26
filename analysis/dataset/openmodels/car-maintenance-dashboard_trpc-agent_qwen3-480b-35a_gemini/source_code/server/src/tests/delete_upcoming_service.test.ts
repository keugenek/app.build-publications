import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { upcomingServicesTable, carsTable } from '../db/schema';
import { deleteUpcomingService } from '../handlers/delete_upcoming_service';
import { eq } from 'drizzle-orm';

describe('deleteUpcomingService', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test car first (required due to foreign key constraint)
    const car = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        vin: '1HGBH41JXMN109186'
      })
      .returning()
      .execute();
    
    // Create a test upcoming service
    await db.insert(upcomingServicesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Oil Change',
        due_date: '2023-12-31',
        due_mileage: 30000,
        notes: 'Regular maintenance'
      })
      .returning()
      .execute();
  });
  
  afterEach(resetDB);

  it('should delete an upcoming service by ID', async () => {
    // Get the service ID to delete
    const services = await db.select()
      .from(upcomingServicesTable)
      .execute();
    
    const serviceId = services[0].id;
    
    // Delete the service
    const result = await deleteUpcomingService(serviceId);
    
    // Check that deletion was successful
    expect(result).toBe(true);
    
    // Verify the service was actually deleted from the database
    const remainingServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, serviceId))
      .execute();
    
    expect(remainingServices).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent service', async () => {
    // Try to delete a service with an ID that doesn't exist
    const result = await deleteUpcomingService(99999);
    
    // Should return false since no rows were affected
    expect(result).toBe(false);
  });
});
