import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { type UpdateMaintenanceRecordInput } from '../schema';
import { updateMaintenanceRecord } from '../handlers/update_maintenance_record';
import { eq } from 'drizzle-orm';

describe('updateMaintenanceRecord', () => {
  let testCarId: number;
  let testMaintenanceRecordId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test car first (required for foreign key)
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TEST123456789',
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();
    
    testCarId = carResult[0].id;

    // Create a test maintenance record to update
    const recordResult = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: testCarId,
        service_date: new Date('2023-01-15'),
        service_type: 'oil_change',
        description: 'Regular oil change',
        cost: '45.99',
        mileage: 50000,
        notes: 'Used synthetic oil'
      })
      .returning()
      .execute();
    
    testMaintenanceRecordId = recordResult[0].id;
  });

  afterEach(resetDB);

  it('should update a maintenance record with all fields', async () => {
    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      service_date: new Date('2023-02-01'),
      service_type: 'brake_service',
      description: 'Brake pad replacement',
      cost: 299.99,
      mileage: 52000,
      notes: 'Replaced front brake pads'
    };

    const result = await updateMaintenanceRecord(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(testMaintenanceRecordId);
    expect(result.car_id).toEqual(testCarId);
    expect(result.service_date).toEqual(new Date('2023-02-01'));
    expect(result.service_type).toEqual('brake_service');
    expect(result.description).toEqual('Brake pad replacement');
    expect(result.cost).toEqual(299.99);
    expect(typeof result.cost).toBe('number');
    expect(result.mileage).toEqual(52000);
    expect(result.notes).toEqual('Replaced front brake pads');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specific fields', async () => {
    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      cost: 55.99,
      notes: 'Updated notes only'
    };

    const result = await updateMaintenanceRecord(updateInput);

    // Verify updated fields
    expect(result.cost).toEqual(55.99);
    expect(result.notes).toEqual('Updated notes only');
    
    // Verify unchanged fields remain the same
    expect(result.service_type).toEqual('oil_change');
    expect(result.description).toEqual('Regular oil change');
    expect(result.mileage).toEqual(50000);
  });

  it('should save updated maintenance record to database', async () => {
    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      service_type: 'tire_rotation',
      cost: 75.00,
      mileage: 51000
    };

    await updateMaintenanceRecord(updateInput);

    // Query database directly to verify changes were persisted
    const records = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, testMaintenanceRecordId))
      .execute();

    expect(records).toHaveLength(1);
    const savedRecord = records[0];
    expect(savedRecord.service_type).toEqual('tire_rotation');
    expect(parseFloat(savedRecord.cost)).toEqual(75.00);
    expect(savedRecord.mileage).toEqual(51000);
    // Unchanged fields should remain
    expect(savedRecord.description).toEqual('Regular oil change');
  });

  it('should update car_id to reference different car', async () => {
    // Create a second test car
    const secondCarResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: 'HONDA123456789',
        license_plate: 'XYZ789',
        current_mileage: 45000
      })
      .returning()
      .execute();

    const secondCarId = secondCarResult[0].id;

    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      car_id: secondCarId
    };

    const result = await updateMaintenanceRecord(updateInput);

    expect(result.car_id).toEqual(secondCarId);
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      notes: null
    };

    const result = await updateMaintenanceRecord(updateInput);

    expect(result.notes).toBeNull();
  });

  it('should handle numeric cost conversion correctly', async () => {
    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      cost: 123.45
    };

    const result = await updateMaintenanceRecord(updateInput);

    expect(result.cost).toEqual(123.45);
    expect(typeof result.cost).toBe('number');

    // Verify in database that numeric value is stored correctly
    const records = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, testMaintenanceRecordId))
      .execute();

    expect(parseFloat(records[0].cost)).toEqual(123.45);
  });

  it('should throw error when maintenance record not found', async () => {
    const updateInput: UpdateMaintenanceRecordInput = {
      id: 99999, // Non-existent ID
      cost: 100.00
    };

    await expect(updateMaintenanceRecord(updateInput)).rejects.toThrow(/Maintenance record with id 99999 not found/i);
  });

  it('should handle future service dates', async () => {
    const futureDate = new Date('2024-12-31');
    const updateInput: UpdateMaintenanceRecordInput = {
      id: testMaintenanceRecordId,
      service_date: futureDate
    };

    const result = await updateMaintenanceRecord(updateInput);

    expect(result.service_date).toEqual(futureDate);
  });

  it('should update to different service types', async () => {
    const serviceTypes: Array<'engine_tune_up' | 'transmission_service' | 'coolant_flush' | 'inspection'> = [
      'engine_tune_up', 
      'transmission_service', 
      'coolant_flush', 
      'inspection'
    ];
    
    for (const serviceType of serviceTypes) {
      const updateInput: UpdateMaintenanceRecordInput = {
        id: testMaintenanceRecordId,
        service_type: serviceType
      };

      const result = await updateMaintenanceRecord(updateInput);
      expect(result.service_type).toEqual(serviceType);
    }
  });
});
