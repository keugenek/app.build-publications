import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type CreateMaintenanceEntryInput } from '../schema';
import { createMaintenanceEntry } from '../handlers/create_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test input for maintenance entry
const testInput: CreateMaintenanceEntryInput = {
  car_id: 1, // Will be updated after creating car
  date: new Date('2023-06-15'),
  service_type: 'Oil Change',
  cost: 49.99,
  mileage_at_service: 15000,
  notes: 'Regular oil change'
};

describe('createMaintenanceEntry', () => {
  beforeEach(async () => {
    await createDB();
    // Create a car first as maintenance entries need a valid car_id
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186',
        current_mileage: 15000
      })
      .returning()
      .execute();
    
    // Update test input with the actual car id
    (testInput as any).car_id = carResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a maintenance entry', async () => {
    const result = await createMaintenanceEntry(testInput);

    // Basic field validation
    expect(result.car_id).toEqual(testInput.car_id);
    expect(result.date).toEqual(testInput.date);
    expect(result.service_type).toEqual(testInput.service_type);
    expect(result.cost).toEqual(49.99);
    expect(result.mileage_at_service).toEqual(testInput.mileage_at_service);
    expect(result.notes).toEqual(testInput.notes ?? null);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save maintenance entry to database', async () => {
    const result = await createMaintenanceEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].car_id).toEqual(testInput.car_id);
    expect(entries[0].date).toEqual(testInput.date);
    expect(entries[0].service_type).toEqual(testInput.service_type);
    expect(parseFloat(entries[0].cost)).toEqual(49.99);
    expect(entries[0].mileage_at_service).toEqual(testInput.mileage_at_service);
    expect(entries[0].notes).toEqual(testInput.notes ?? null);
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle maintenance entry without notes', async () => {
    const inputWithoutNotes: CreateMaintenanceEntryInput = {
      car_id: testInput.car_id,
      date: new Date('2023-07-20'),
      service_type: 'Tire Rotation',
      cost: 25.00,
      mileage_at_service: 16000
      // notes is optional and omitted
    };

    const result = await createMaintenanceEntry(inputWithoutNotes);

    expect(result.car_id).toEqual(inputWithoutNotes.car_id);
    expect(result.date).toEqual(inputWithoutNotes.date);
    expect(result.service_type).toEqual(inputWithoutNotes.service_type);
    expect(result.cost).toEqual(25.00);
    expect(result.mileage_at_service).toEqual(inputWithoutNotes.mileage_at_service);
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
  });
});
