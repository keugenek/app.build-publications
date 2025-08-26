import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type CreateMaintenanceEntryInput } from '../schema';
import { createMaintenanceEntry } from '../handlers/create_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test car data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123'
};

// Test maintenance entry input
const testMaintenanceEntryInput: CreateMaintenanceEntryInput = {
  car_id: 1, // Will be updated after creating test car
  service_date: new Date('2024-01-15'),
  mileage: 50000,
  service_type: 'oil_change',
  cost: 49.99,
  notes: 'Routine oil change with synthetic oil'
};

describe('createMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a maintenance entry', async () => {
    // First create a test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const createdCar = carResult[0];
    const input = { ...testMaintenanceEntryInput, car_id: createdCar.id };

    const result = await createMaintenanceEntry(input);

    // Basic field validation
    expect(result.car_id).toEqual(createdCar.id);
    expect(result.service_date).toEqual(new Date('2024-01-15'));
    expect(result.mileage).toEqual(50000);
    expect(result.service_type).toEqual('oil_change');
    expect(result.cost).toEqual(49.99);
    expect(typeof result.cost).toEqual('number'); // Verify numeric conversion
    expect(result.notes).toEqual('Routine oil change with synthetic oil');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save maintenance entry to database', async () => {
    // First create a test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const createdCar = carResult[0];
    const input = { ...testMaintenanceEntryInput, car_id: createdCar.id };

    const result = await createMaintenanceEntry(input);

    // Query the database to verify the entry was saved
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const savedEntry = entries[0];
    expect(savedEntry.car_id).toEqual(createdCar.id);
    expect(savedEntry.service_date).toEqual(new Date('2024-01-15'));
    expect(savedEntry.mileage).toEqual(50000);
    expect(savedEntry.service_type).toEqual('oil_change');
    expect(parseFloat(savedEntry.cost)).toEqual(49.99); // Verify stored as numeric string
    expect(savedEntry.notes).toEqual('Routine oil change with synthetic oil');
    expect(savedEntry.created_at).toBeInstanceOf(Date);
  });

  it('should handle maintenance entry with null notes', async () => {
    // First create a test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const createdCar = carResult[0];
    const input: CreateMaintenanceEntryInput = {
      car_id: createdCar.id,
      service_date: new Date('2024-02-01'),
      mileage: 52000,
      service_type: 'tire_rotation',
      cost: 25.50,
      notes: null
    };

    const result = await createMaintenanceEntry(input);

    expect(result.car_id).toEqual(createdCar.id);
    expect(result.service_type).toEqual('tire_rotation');
    expect(result.cost).toEqual(25.50);
    expect(result.notes).toBeNull();
  });

  it('should handle different service types', async () => {
    // First create a test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const createdCar = carResult[0];

    // Test brake service
    const brakeServiceInput: CreateMaintenanceEntryInput = {
      car_id: createdCar.id,
      service_date: new Date('2024-03-15'),
      mileage: 55000,
      service_type: 'brake_service',
      cost: 299.99,
      notes: 'Front brake pads replaced'
    };

    const result = await createMaintenanceEntry(brakeServiceInput);

    expect(result.service_type).toEqual('brake_service');
    expect(result.cost).toEqual(299.99);
    expect(result.notes).toEqual('Front brake pads replaced');
  });

  it('should handle zero cost maintenance entries', async () => {
    // First create a test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const createdCar = carResult[0];
    const input: CreateMaintenanceEntryInput = {
      car_id: createdCar.id,
      service_date: new Date('2024-04-01'),
      mileage: 60000,
      service_type: 'inspection',
      cost: 0,
      notes: 'Free inspection under warranty'
    };

    const result = await createMaintenanceEntry(input);

    expect(result.cost).toEqual(0);
    expect(typeof result.cost).toEqual('number');
  });

  it('should throw error when car does not exist', async () => {
    const input: CreateMaintenanceEntryInput = {
      car_id: 999, // Non-existent car ID
      service_date: new Date('2024-01-15'),
      mileage: 50000,
      service_type: 'oil_change',
      cost: 49.99,
      notes: 'Test entry'
    };

    await expect(createMaintenanceEntry(input)).rejects.toThrow(/Car with id 999 not found/i);
  });

  it('should create multiple maintenance entries for the same car', async () => {
    // First create a test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const createdCar = carResult[0];

    // Create first maintenance entry
    const firstEntry: CreateMaintenanceEntryInput = {
      car_id: createdCar.id,
      service_date: new Date('2024-01-15'),
      mileage: 50000,
      service_type: 'oil_change',
      cost: 49.99,
      notes: 'First oil change'
    };

    // Create second maintenance entry
    const secondEntry: CreateMaintenanceEntryInput = {
      car_id: createdCar.id,
      service_date: new Date('2024-02-15'),
      mileage: 53000,
      service_type: 'tire_rotation',
      cost: 25.00,
      notes: 'Tire rotation service'
    };

    const firstResult = await createMaintenanceEntry(firstEntry);
    const secondResult = await createMaintenanceEntry(secondEntry);

    // Verify both entries exist and are different
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.service_type).toEqual('oil_change');
    expect(secondResult.service_type).toEqual('tire_rotation');

    // Verify both are saved in database
    const allEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, createdCar.id))
      .execute();

    expect(allEntries).toHaveLength(2);
  });
});
