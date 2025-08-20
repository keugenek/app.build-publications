import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { maintenanceEntriesTable, carsTable } from '../db/schema';
import { type CreateMaintenanceEntryInput } from '../schema';
import { createMaintenanceEntry } from '../handlers/create_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test car data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  current_mileage: 50000
};

// Test input for maintenance entry
const testInput: CreateMaintenanceEntryInput = {
  car_id: 0, // Will be set after creating test car
  service_date: new Date('2024-01-15'),
  service_type: 'Oil Change',
  description: 'Regular oil change with synthetic oil',
  cost: 45.99,
  mileage_at_service: 51000
};

describe('createMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a maintenance entry', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testInput, car_id: car.id };

    const result = await createMaintenanceEntry(input);

    // Basic field validation
    expect(result.car_id).toEqual(car.id);
    expect(result.service_date).toEqual(new Date('2024-01-15'));
    expect(result.service_type).toEqual('Oil Change');
    expect(result.description).toEqual('Regular oil change with synthetic oil');
    expect(result.cost).toEqual(45.99);
    expect(typeof result.cost).toEqual('number');
    expect(result.mileage_at_service).toEqual(51000);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save maintenance entry to database', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testInput, car_id: car.id };

    const result = await createMaintenanceEntry(input);

    // Query using proper drizzle syntax
    const maintenanceEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(maintenanceEntries).toHaveLength(1);
    expect(maintenanceEntries[0].car_id).toEqual(car.id);
    expect(maintenanceEntries[0].service_type).toEqual('Oil Change');
    expect(maintenanceEntries[0].description).toEqual('Regular oil change with synthetic oil');
    expect(parseFloat(maintenanceEntries[0].cost)).toEqual(45.99);
    expect(maintenanceEntries[0].mileage_at_service).toEqual(51000);
    expect(maintenanceEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should update car mileage when service mileage is higher', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testInput, car_id: car.id, mileage_at_service: 55000 }; // Higher than current

    await createMaintenanceEntry(input);

    // Check that car's current mileage was updated
    const updatedCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(updatedCars).toHaveLength(1);
    expect(updatedCars[0].current_mileage).toEqual(55000);
    expect(updatedCars[0].updated_at.getTime()).toBeGreaterThan(car.updated_at.getTime());
  });

  it('should not update car mileage when service mileage is lower or equal', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testInput, car_id: car.id, mileage_at_service: 45000 }; // Lower than current

    await createMaintenanceEntry(input);

    // Check that car's current mileage was NOT updated
    const updatedCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(updatedCars).toHaveLength(1);
    expect(updatedCars[0].current_mileage).toEqual(50000); // Should remain original value
  });

  it('should handle null description', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testInput, car_id: car.id, description: null };

    const result = await createMaintenanceEntry(input);

    expect(result.description).toBeNull();

    // Verify in database
    const maintenanceEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(maintenanceEntries[0].description).toBeNull();
  });

  it('should throw error when car does not exist', async () => {
    const input = { ...testInput, car_id: 999 }; // Non-existent car ID

    await expect(createMaintenanceEntry(input)).rejects.toThrow(/car with id 999 not found/i);
  });

  it('should handle zero cost maintenance entry', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testInput, car_id: car.id, cost: 0.00 };

    const result = await createMaintenanceEntry(input);

    expect(result.cost).toEqual(0.00);
    expect(typeof result.cost).toEqual('number');

    // Verify in database
    const maintenanceEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(parseFloat(maintenanceEntries[0].cost)).toEqual(0.00);
  });
});
