import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { maintenanceRecordsTable, carsTable } from '../db/schema';
import { type CreateMaintenanceRecordInput } from '../schema';
import { createMaintenanceRecord } from '../handlers/create_maintenance_record';
import { eq } from 'drizzle-orm';

// Test car data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  vin: '12345678901234567'
};

// Test maintenance record input
const testInput: CreateMaintenanceRecordInput = {
  car_id: 1,
  service_type: 'Oil Change',
  date: new Date('2023-01-15'),
  mileage: 15000,
  cost: 49.99,
  notes: 'Regular oil change'
};

describe('createMaintenanceRecord', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test car first since maintenance records reference cars
    await db.insert(carsTable).values(testCar).execute();
  });
  
  afterEach(resetDB);

  it('should create a maintenance record', async () => {
    const result = await createMaintenanceRecord(testInput);

    // Basic field validation
    expect(result.car_id).toEqual(testInput.car_id);
    expect(result.service_type).toEqual(testInput.service_type);
    expect(result.date).toEqual(testInput.date);
    expect(result.mileage).toEqual(testInput.mileage);
    expect(result.cost).toEqual(49.99);
    expect(result.notes).toEqual(testInput.notes ?? null);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save maintenance record to database', async () => {
    const result = await createMaintenanceRecord(testInput);

    // Query using proper drizzle syntax
    const records = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].car_id).toEqual(testInput.car_id);
    expect(records[0].service_type).toEqual(testInput.service_type);
    expect(new Date(records[0].date)).toEqual(testInput.date);
    expect(records[0].mileage).toEqual(testInput.mileage);
    expect(parseFloat(records[0].cost)).toEqual(49.99);
    expect(records[0].notes).toEqual(testInput.notes ?? null);
    expect(records[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle maintenance record with null notes', async () => {
    const inputWithoutNotes: CreateMaintenanceRecordInput = {
      car_id: 1,
      service_type: 'Tire Rotation',
      date: new Date('2023-02-20'),
      mileage: 16000,
      cost: 29.99,
      notes: null
    };

    const result = await createMaintenanceRecord(inputWithoutNotes);

    expect(result.service_type).toEqual('Tire Rotation');
    expect(result.cost).toEqual(29.99);
    expect(result.notes).toBeNull();
  });

  it('should handle maintenance record with undefined notes', async () => {
    const inputWithoutNotes: CreateMaintenanceRecordInput = {
      car_id: 1,
      service_type: 'Brake Inspection',
      date: new Date('2023-03-10'),
      mileage: 17000,
      cost: 0,
      notes: null
    };

    const result = await createMaintenanceRecord(inputWithoutNotes);

    expect(result.service_type).toEqual('Brake Inspection');
    expect(result.cost).toEqual(0);
    expect(result.notes).toBeNull();
  });
});
