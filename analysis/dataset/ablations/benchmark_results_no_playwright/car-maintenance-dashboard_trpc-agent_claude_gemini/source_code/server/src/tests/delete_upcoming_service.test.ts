import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type DeleteRecordInput } from '../schema';
import { deleteUpcomingService } from '../handlers/delete_upcoming_service';
import { eq } from 'drizzle-orm';

// Test data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: 'TEST123456789',
  license_plate: 'TEST123',
  current_mileage: 50000
};

const testUpcomingService = {
  service_type: 'oil_change' as const,
  description: 'Regular oil change service',
  due_date: new Date('2024-06-01'),
  due_mileage: 55000,
  notes: 'Use synthetic oil'
};

describe('deleteUpcomingService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an upcoming service successfully', async () => {
    // Create a car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const car = carResult[0];

    // Create an upcoming service
    const serviceResult = await db.insert(upcomingServicesTable)
      .values({
        car_id: car.id,
        ...testUpcomingService
      })
      .returning()
      .execute();

    const upcomingService = serviceResult[0];

    // Delete the upcoming service
    const input: DeleteRecordInput = { id: upcomingService.id };
    const result = await deleteUpcomingService(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify record was actually deleted from database
    const deletedServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, upcomingService.id))
      .execute();

    expect(deletedServices).toHaveLength(0);
  });

  it('should throw error when upcoming service does not exist', async () => {
    const nonExistentId = 99999;
    const input: DeleteRecordInput = { id: nonExistentId };

    // Attempt to delete non-existent service
    await expect(deleteUpcomingService(input)).rejects.toThrow(/not found/i);
  });

  it('should not affect other upcoming services when deleting one', async () => {
    // Create a car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const car = carResult[0];

    // Create multiple upcoming services
    const service1Result = await db.insert(upcomingServicesTable)
      .values({
        car_id: car.id,
        ...testUpcomingService
      })
      .returning()
      .execute();

    const service2Result = await db.insert(upcomingServicesTable)
      .values({
        car_id: car.id,
        service_type: 'brake_service' as const,
        description: 'Brake inspection and service',
        due_date: new Date('2024-07-01'),
        due_mileage: 60000,
        notes: 'Check brake pads'
      })
      .returning()
      .execute();

    const service1 = service1Result[0];
    const service2 = service2Result[0];

    // Delete only the first service
    const input: DeleteRecordInput = { id: service1.id };
    const result = await deleteUpcomingService(input);

    expect(result.success).toBe(true);

    // Verify first service was deleted
    const deletedServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, service1.id))
      .execute();

    expect(deletedServices).toHaveLength(0);

    // Verify second service still exists
    const remainingServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, service2.id))
      .execute();

    expect(remainingServices).toHaveLength(1);
    expect(remainingServices[0].id).toEqual(service2.id);
    expect(remainingServices[0].service_type).toEqual('brake_service');
  });

  it('should handle deletion of completed upcoming service', async () => {
    // Create a car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const car = carResult[0];

    // Create a completed upcoming service
    const serviceResult = await db.insert(upcomingServicesTable)
      .values({
        car_id: car.id,
        ...testUpcomingService,
        is_completed: true
      })
      .returning()
      .execute();

    const upcomingService = serviceResult[0];

    // Delete the completed service
    const input: DeleteRecordInput = { id: upcomingService.id };
    const result = await deleteUpcomingService(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify record was actually deleted from database
    const deletedServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, upcomingService.id))
      .execute();

    expect(deletedServices).toHaveLength(0);
  });
});
