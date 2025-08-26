import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type UpdateMaintenanceEntryInput, type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { updateMaintenanceEntry } from '../handlers/update_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test data
const testCar: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2020,
  license_plate: 'ABC123',
  current_mileage: 50000
};

const testMaintenanceEntry: CreateMaintenanceEntryInput = {
  car_id: 1, // Will be set after car creation
  service_date: new Date('2023-01-15'),
  service_type: 'Oil Change',
  description: 'Regular oil change service',
  cost: 45.99,
  mileage_at_service: 45000
};

const partialUpdateInput: UpdateMaintenanceEntryInput = {
  id: 1, // Will be set after maintenance entry creation
  service_type: 'Transmission Service',
  cost: 120.50
};

const fullUpdateInput: UpdateMaintenanceEntryInput = {
  id: 1, // Will be set after maintenance entry creation
  service_date: new Date('2023-02-20'),
  service_type: 'Brake Inspection',
  description: 'Complete brake system inspection',
  cost: 85.75,
  mileage_at_service: 47500
};

describe('updateMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update only specified fields of a maintenance entry', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance entry to update
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: testMaintenanceEntry.description,
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const originalEntry = maintenanceResult[0];

    // Update only service_type and cost
    const updateInput = {
      ...partialUpdateInput,
      id: originalEntry.id
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Check updated fields
    expect(result.id).toEqual(originalEntry.id);
    expect(result.car_id).toEqual(car.id);
    expect(result.service_type).toEqual('Transmission Service');
    expect(result.cost).toEqual(120.50);
    expect(typeof result.cost).toBe('number');

    // Check unchanged fields
    expect(result.service_date).toEqual(testMaintenanceEntry.service_date);
    expect(result.description).toEqual(testMaintenanceEntry.description);
    expect(result.mileage_at_service).toEqual(testMaintenanceEntry.mileage_at_service);

    // Check timestamps
    expect(result.created_at).toEqual(originalEntry.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalEntry.updated_at).toBe(true);
  });

  it('should update all fields when provided', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance entry to update
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: testMaintenanceEntry.description,
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const originalEntry = maintenanceResult[0];

    // Update all fields
    const updateInput = {
      ...fullUpdateInput,
      id: originalEntry.id
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Check all updated fields
    expect(result.id).toEqual(originalEntry.id);
    expect(result.car_id).toEqual(car.id);
    expect(result.service_date).toEqual(new Date('2023-02-20'));
    expect(result.service_type).toEqual('Brake Inspection');
    expect(result.description).toEqual('Complete brake system inspection');
    expect(result.cost).toEqual(85.75);
    expect(typeof result.cost).toBe('number');
    expect(result.mileage_at_service).toEqual(47500);

    // Check timestamps
    expect(result.created_at).toEqual(originalEntry.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalEntry.updated_at).toBe(true);
  });

  it('should update description to null when explicitly set', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance entry with description
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: 'Original description',
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const originalEntry = maintenanceResult[0];

    // Update description to null
    const updateInput: UpdateMaintenanceEntryInput = {
      id: originalEntry.id,
      description: null
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.description).toBeNull();
    expect(result.updated_at > originalEntry.updated_at).toBe(true);
  });

  it('should save updated maintenance entry to database', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance entry to update
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: testMaintenanceEntry.description,
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const originalEntry = maintenanceResult[0];

    // Update maintenance entry
    const updateInput = {
      ...partialUpdateInput,
      id: originalEntry.id
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Verify database was updated
    const maintenanceEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(maintenanceEntries).toHaveLength(1);
    const savedEntry = maintenanceEntries[0];
    expect(savedEntry.service_type).toEqual('Transmission Service');
    expect(parseFloat(savedEntry.cost)).toEqual(120.50);
    expect(savedEntry.updated_at).toBeInstanceOf(Date);
    expect(savedEntry.updated_at > originalEntry.updated_at).toBe(true);
  });

  it('should throw error when maintenance entry does not exist', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: 999, // Non-existent ID
      service_type: 'Oil Change'
    };

    expect(updateMaintenanceEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle zero cost correctly', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance entry
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: testMaintenanceEntry.description,
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const originalEntry = maintenanceResult[0];

    // Update with zero cost
    const updateInput: UpdateMaintenanceEntryInput = {
      id: originalEntry.id,
      cost: 0
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.cost).toEqual(0);
    expect(typeof result.cost).toBe('number');
  });
});
