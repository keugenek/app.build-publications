import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteCar } from '../handlers/delete_car';

// Test data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  vin: '12345678901234567'
};

const testMaintenanceEntry = {
  dateOfService: '2023-01-15',
  serviceType: 'Oil Change',
  cost: '45.99',
  mileage: 15000,
  notes: 'Regular oil change'
};

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a car and return true', async () => {
    // First create a car
    const [createdCar] = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    // Delete the car
    const result = await deleteCar(createdCar.id);
    
    // Check that deletion was successful
    expect(result).toBe(true);
    
    // Verify car no longer exists
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, createdCar.id))
      .execute();
    
    expect(cars).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent car', async () => {
    const result = await deleteCar(99999);
    expect(result).toBe(false);
  });

  it('should delete associated maintenance entries when deleting a car', async () => {
    // First create a car
    const [createdCar] = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    // Create a maintenance entry for this car
    await db.insert(maintenanceEntriesTable)
      .values({
        carId: createdCar.id,
        ...testMaintenanceEntry
      })
      .execute();
    
    // Verify maintenance entry exists
    const entriesBefore = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.carId, createdCar.id))
      .execute();
    
    expect(entriesBefore).toHaveLength(1);
    
    // Delete the car
    const result = await deleteCar(createdCar.id);
    expect(result).toBe(true);
    
    // Verify maintenance entries are also deleted
    const entriesAfter = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.carId, createdCar.id))
      .execute();
    
    expect(entriesAfter).toHaveLength(0);
    
    // Verify car no longer exists
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, createdCar.id))
      .execute();
    
    expect(cars).toHaveLength(0);
  });

  it('should handle deletion of car with multiple maintenance entries', async () => {
    // First create a car
    const [createdCar] = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    // Create multiple maintenance entries for this car
    await db.insert(maintenanceEntriesTable)
      .values([{
        carId: createdCar.id,
        ...testMaintenanceEntry
      }, {
        carId: createdCar.id,
        dateOfService: '2023-06-20',
        serviceType: 'Tire Rotation',
        cost: '25.00',
        mileage: 18000,
        notes: 'Rotated all tires'
      }])
      .execute();
    
    // Verify maintenance entries exist
    const entriesBefore = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.carId, createdCar.id))
      .execute();
    
    expect(entriesBefore).toHaveLength(2);
    
    // Delete the car
    const result = await deleteCar(createdCar.id);
    expect(result).toBe(true);
    
    // Verify all maintenance entries are deleted
    const entriesAfter = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.carId, createdCar.id))
      .execute();
    
    expect(entriesAfter).toHaveLength(0);
  });
});
