import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { maintenanceEntriesTable, carsTable } from '../db/schema';
import { type CreateMaintenanceEntryInput } from '../schema';
import { createMaintenanceEntry } from '../handlers/create_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test input for maintenance entry
const testMaintenanceInput: CreateMaintenanceEntryInput = {
  carId: 1,
  dateOfService: new Date('2023-05-15'),
  serviceType: 'Oil Change',
  cost: 49.99,
  mileage: 15000,
  notes: 'Regular oil change'
};

// Test car data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  vin: '12345678901234567',
  nextServiceDate: '2024-05-15', // String format for date
  nextServiceMileage: 20000
};

describe('createMaintenanceEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test car first since maintenance entries reference cars
    await db.insert(carsTable).values(testCar).execute();
  });
  
  afterEach(resetDB);

  it('should create a maintenance entry', async () => {
    const result = await createMaintenanceEntry(testMaintenanceInput);

    // Basic field validation
    expect(result.carId).toEqual(1);
    expect(result.dateOfService).toEqual(new Date('2023-05-15'));
    expect(result.serviceType).toEqual('Oil Change');
    expect(result.cost).toEqual(49.99);
    expect(result.mileage).toEqual(15000);
    expect(result.notes).toEqual('Regular oil change');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save maintenance entry to database', async () => {
    const result = await createMaintenanceEntry(testMaintenanceInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].carId).toEqual(1);
    expect(new Date(entries[0].dateOfService)).toEqual(new Date('2023-05-15'));
    expect(entries[0].serviceType).toEqual('Oil Change');
    expect(parseFloat(entries[0].cost)).toEqual(49.99);
    expect(entries[0].mileage).toEqual(15000);
    expect(entries[0].notes).toEqual('Regular oil change');
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle maintenance entry without notes', async () => {
    const inputWithoutNotes: CreateMaintenanceEntryInput = {
      carId: 1,
      dateOfService: new Date('2023-06-20'),
      serviceType: 'Tire Rotation',
      cost: 29.99,
      mileage: 16000
      // notes is optional
    };

    const result = await createMaintenanceEntry(inputWithoutNotes);

    expect(result.serviceType).toEqual('Tire Rotation');
    expect(result.cost).toEqual(29.99);
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
  });
});
