import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable, upcomingServicesTable } from '../db/schema';
import { deleteCar } from '../handlers/delete_car';
import { eq } from 'drizzle-orm';

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a car and its related records', async () => {
    // Create a car directly in the database
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        vin: '12345678901234567'
      })
      .returning()
      .execute();
    
    const createdCar = carResult[0];
    
    // Create related maintenance record
    const maintenanceResult = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: createdCar.id,
        service_type: 'Oil Change',
        date: '2023-01-15',
        mileage: 15000,
        cost: '50.00',
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    
    // Create related upcoming service
    const upcomingResult = await db.insert(upcomingServicesTable)
      .values({
        car_id: createdCar.id,
        service_type: 'Tire Rotation',
        due_date: '2024-01-15',
        due_mileage: 20000,
        notes: 'Scheduled maintenance'
      })
      .returning()
      .execute();
    
    // Verify the records exist
    const carsBefore = await db.select().from(carsTable).where(eq(carsTable.id, createdCar.id)).execute();
    expect(carsBefore).toHaveLength(1);
    
    const maintenanceRecordsBefore = await db.select().from(maintenanceRecordsTable).where(eq(maintenanceRecordsTable.car_id, createdCar.id)).execute();
    expect(maintenanceRecordsBefore).toHaveLength(1);
    
    const upcomingServicesBefore = await db.select().from(upcomingServicesTable).where(eq(upcomingServicesTable.car_id, createdCar.id)).execute();
    expect(upcomingServicesBefore).toHaveLength(1);
    
    // Delete the car
    const result = await deleteCar(createdCar.id);
    
    // Verify the result
    expect(result).toBe(true);
    
    // Verify the car is deleted
    const carsAfter = await db.select().from(carsTable).where(eq(carsTable.id, createdCar.id)).execute();
    expect(carsAfter).toHaveLength(0);
    
    // Verify related maintenance records are deleted
    const maintenanceRecordsAfter = await db.select().from(maintenanceRecordsTable).where(eq(maintenanceRecordsTable.car_id, createdCar.id)).execute();
    expect(maintenanceRecordsAfter).toHaveLength(0);
    
    // Verify related upcoming services are deleted
    const upcomingServicesAfter = await db.select().from(upcomingServicesTable).where(eq(upcomingServicesTable.car_id, createdCar.id)).execute();
    expect(upcomingServicesAfter).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent car', async () => {
    const result = await deleteCar(99999);
    expect(result).toBe(false);
  });

  it('should properly handle deleting a car with no related records', async () => {
    // Create a car without any related records
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'XYZ789',
        vin: '76543210987654321'
      })
      .returning()
      .execute();
    
    const createdCar = carResult[0];
    
    // Verify the car exists
    const carsBefore = await db.select().from(carsTable).where(eq(carsTable.id, createdCar.id)).execute();
    expect(carsBefore).toHaveLength(1);
    
    // Delete the car
    const result = await deleteCar(createdCar.id);
    
    // Verify the result
    expect(result).toBe(true);
    
    // Verify the car is deleted
    const carsAfter = await db.select().from(carsTable).where(eq(carsTable.id, createdCar.id)).execute();
    expect(carsAfter).toHaveLength(0);
  });
});
