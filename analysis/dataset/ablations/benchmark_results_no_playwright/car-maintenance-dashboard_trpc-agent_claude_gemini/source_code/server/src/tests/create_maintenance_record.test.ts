import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { type CreateMaintenanceRecordInput } from '../schema';
import { createMaintenanceRecord } from '../handlers/create_maintenance_record';
import { eq } from 'drizzle-orm';

describe('createMaintenanceRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCarId: number;

  // Create a test car before each test
  beforeEach(async () => {
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TEST123VIN',
        license_plate: 'TEST123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    testCarId = carResult[0].id;
  });

  const testInput: CreateMaintenanceRecordInput = {
    car_id: 0, // Will be set to testCarId in tests
    service_date: new Date('2024-01-15'),
    service_type: 'oil_change',
    description: 'Regular oil change service',
    cost: 59.99,
    mileage: 52000,
    notes: 'Used synthetic oil'
  };

  it('should create a maintenance record', async () => {
    const input = { ...testInput, car_id: testCarId };
    const result = await createMaintenanceRecord(input);

    // Basic field validation
    expect(result.car_id).toEqual(testCarId);
    expect(result.service_date).toEqual(input.service_date);
    expect(result.service_type).toEqual('oil_change');
    expect(result.description).toEqual('Regular oil change service');
    expect(result.cost).toEqual(59.99);
    expect(typeof result.cost).toEqual('number'); // Verify numeric conversion
    expect(result.mileage).toEqual(52000);
    expect(result.notes).toEqual('Used synthetic oil');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save maintenance record to database', async () => {
    const input = { ...testInput, car_id: testCarId };
    const result = await createMaintenanceRecord(input);

    // Query using proper drizzle syntax
    const maintenanceRecords = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, result.id))
      .execute();

    expect(maintenanceRecords).toHaveLength(1);
    const record = maintenanceRecords[0];
    expect(record.car_id).toEqual(testCarId);
    expect(record.service_date).toEqual(input.service_date);
    expect(record.service_type).toEqual('oil_change');
    expect(record.description).toEqual('Regular oil change service');
    expect(parseFloat(record.cost)).toEqual(59.99); // Verify database stores as string
    expect(record.mileage).toEqual(52000);
    expect(record.notes).toEqual('Used synthetic oil');
    expect(record.created_at).toBeInstanceOf(Date);
  });

  it('should handle maintenance record with null notes', async () => {
    const input = { ...testInput, car_id: testCarId, notes: null };
    const result = await createMaintenanceRecord(input);

    expect(result.notes).toBeNull();
    expect(result.car_id).toEqual(testCarId);
    expect(result.cost).toEqual(59.99);
  });

  it('should handle different service types', async () => {
    const input = { 
      ...testInput, 
      car_id: testCarId,
      service_type: 'brake_service' as const,
      description: 'Front brake pad replacement',
      cost: 199.50
    };
    const result = await createMaintenanceRecord(input);

    expect(result.service_type).toEqual('brake_service');
    expect(result.description).toEqual('Front brake pad replacement');
    expect(result.cost).toEqual(199.50);
    expect(typeof result.cost).toEqual('number');
  });

  it('should handle zero cost maintenance records', async () => {
    const input = { 
      ...testInput, 
      car_id: testCarId,
      cost: 0,
      description: 'Warranty repair'
    };
    const result = await createMaintenanceRecord(input);

    expect(result.cost).toEqual(0);
    expect(typeof result.cost).toEqual('number');
    expect(result.description).toEqual('Warranty repair');
  });

  it('should throw error for non-existent car', async () => {
    const input = { ...testInput, car_id: 99999 }; // Non-existent car ID

    await expect(createMaintenanceRecord(input)).rejects.toThrow(/Car with id 99999 not found/i);
  });

  it('should handle high precision cost values', async () => {
    const input = { 
      ...testInput, 
      car_id: testCarId,
      cost: 123.45678 // High precision value
    };
    const result = await createMaintenanceRecord(input);

    // Should maintain reasonable precision
    expect(result.cost).toBeCloseTo(123.46, 2);
    expect(typeof result.cost).toEqual('number');
  });

  it('should create multiple maintenance records for same car', async () => {
    const input1 = { 
      ...testInput, 
      car_id: testCarId,
      service_type: 'oil_change' as const,
      cost: 59.99
    };
    const input2 = { 
      ...testInput, 
      car_id: testCarId,
      service_type: 'tire_rotation' as const,
      description: 'Tire rotation service',
      cost: 35.00,
      mileage: 53000
    };

    const result1 = await createMaintenanceRecord(input1);
    const result2 = await createMaintenanceRecord(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.car_id).toEqual(result2.car_id);
    expect(result1.service_type).toEqual('oil_change');
    expect(result2.service_type).toEqual('tire_rotation');
    expect(result1.cost).toEqual(59.99);
    expect(result2.cost).toEqual(35.00);
  });
});
