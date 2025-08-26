import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type UpdateMaintenanceEntryInput, type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { updateMaintenanceEntry } from '../handlers/update_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test data
const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123'
};

const testMaintenanceEntry: CreateMaintenanceEntryInput = {
  car_id: 1,
  service_date: new Date('2024-01-15'),
  mileage: 25000,
  service_type: 'oil_change',
  cost: 49.99,
  notes: 'Regular oil change service'
};

describe('updateMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let carId: number;
  let maintenanceEntryId: number;

  beforeEach(async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate
      })
      .returning()
      .execute();
    
    carId = carResult[0].id;

    // Create prerequisite maintenance entry
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: testMaintenanceEntry.service_date,
        mileage: testMaintenanceEntry.mileage,
        service_type: testMaintenanceEntry.service_type,
        cost: testMaintenanceEntry.cost.toString(),
        notes: testMaintenanceEntry.notes
      })
      .returning()
      .execute();
    
    maintenanceEntryId = maintenanceResult[0].id;
  });

  it('should update all fields of a maintenance entry', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      service_date: new Date('2024-02-15'),
      mileage: 26000,
      service_type: 'brake_service',
      cost: 89.99,
      notes: 'Brake pad replacement'
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(maintenanceEntryId);
    expect(result.car_id).toEqual(carId);
    expect(result.service_date).toEqual(new Date('2024-02-15'));
    expect(result.mileage).toEqual(26000);
    expect(result.service_type).toEqual('brake_service');
    expect(result.cost).toEqual(89.99);
    expect(typeof result.cost).toBe('number');
    expect(result.notes).toEqual('Brake pad replacement');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      cost: 59.99,
      notes: 'Updated notes only'
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Verify updated fields
    expect(result.cost).toEqual(59.99);
    expect(result.notes).toEqual('Updated notes only');
    
    // Verify unchanged fields
    expect(result.service_date).toEqual(new Date('2024-01-15'));
    expect(result.mileage).toEqual(25000);
    expect(result.service_type).toEqual('oil_change');
  });

  it('should save updated maintenance entry to database', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      service_type: 'tire_rotation',
      cost: 39.99
    };

    await updateMaintenanceEntry(updateInput);

    // Verify database was updated
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntryId))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].service_type).toEqual('tire_rotation');
    expect(parseFloat(entries[0].cost)).toEqual(39.99);
    expect(entries[0].mileage).toEqual(25000); // Unchanged
  });

  it('should handle null notes field', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      notes: null
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.notes).toBeNull();
  });

  it('should handle zero cost', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      cost: 0
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.cost).toEqual(0);
    expect(typeof result.cost).toBe('number');
  });

  it('should throw error when maintenance entry does not exist', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: 99999,
      cost: 100.00
    };

    expect(updateMaintenanceEntry(updateInput)).rejects.toThrow(/maintenance entry with id 99999 not found/i);
  });

  it('should update service date correctly', async () => {
    const newDate = new Date('2024-03-20');
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      service_date: newDate
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.service_date).toEqual(newDate);
    expect(result.service_date).toBeInstanceOf(Date);
  });

  it('should update mileage correctly', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      mileage: 30000
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.mileage).toEqual(30000);
  });

  it('should update service type correctly', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: maintenanceEntryId,
      service_type: 'engine_tune_up'
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.service_type).toEqual('engine_tune_up');
  });
});
