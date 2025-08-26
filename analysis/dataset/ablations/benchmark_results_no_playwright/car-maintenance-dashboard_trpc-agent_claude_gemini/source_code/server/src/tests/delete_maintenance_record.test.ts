import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { type DeleteRecordInput } from '../schema';
import { deleteMaintenanceRecord } from '../handlers/delete_maintenance_record';
import { eq } from 'drizzle-orm';

describe('deleteMaintenanceRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a maintenance record', async () => {
    // Create a test car first
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

    const car = carResult[0];

    // Create a test maintenance record
    const recordResult = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_date: new Date('2024-01-15'),
        service_type: 'oil_change',
        description: 'Regular oil change',
        cost: '89.99',
        mileage: 50000,
        notes: 'Used synthetic oil'
      })
      .returning()
      .execute();

    const record = recordResult[0];

    const input: DeleteRecordInput = {
      id: record.id
    };

    // Delete the maintenance record
    const result = await deleteMaintenanceRecord(input);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the record was actually deleted from the database
    const deletedRecord = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, record.id))
      .execute();

    expect(deletedRecord).toHaveLength(0);
  });

  it('should return success even when deleting non-existent record', async () => {
    const input: DeleteRecordInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteMaintenanceRecord(input);

    // Should still return success (idempotent operation)
    expect(result.success).toBe(true);
  });

  it('should not affect other maintenance records', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: 'HONDA123456789',
        license_plate: 'XYZ789',
        current_mileage: 40000
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create two test maintenance records
    const record1Result = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_date: new Date('2024-01-15'),
        service_type: 'oil_change',
        description: 'First oil change',
        cost: '89.99',
        mileage: 40000,
        notes: null
      })
      .returning()
      .execute();

    const record2Result = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_date: new Date('2024-02-15'),
        service_type: 'tire_rotation',
        description: 'Tire rotation service',
        cost: '45.00',
        mileage: 41000,
        notes: 'All tires rotated'
      })
      .returning()
      .execute();

    const record1 = record1Result[0];
    const record2 = record2Result[0];

    const input: DeleteRecordInput = {
      id: record1.id
    };

    // Delete only the first record
    const result = await deleteMaintenanceRecord(input);

    expect(result.success).toBe(true);

    // Verify first record is deleted
    const deletedRecord = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, record1.id))
      .execute();

    expect(deletedRecord).toHaveLength(0);

    // Verify second record still exists
    const remainingRecord = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, record2.id))
      .execute();

    expect(remainingRecord).toHaveLength(1);
    expect(remainingRecord[0].description).toEqual('Tire rotation service');
  });

  it('should handle database errors', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'Focus',
        year: 2018,
        vin: 'FORD123456789',
        license_plate: 'DEF456',
        current_mileage: 60000
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create a test maintenance record
    const recordResult = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_date: new Date('2024-01-15'),
        service_type: 'brake_service',
        description: 'Brake pad replacement',
        cost: '299.99',
        mileage: 60000,
        notes: 'Front brake pads replaced'
      })
      .returning()
      .execute();

    const record = recordResult[0];

    // First deletion should succeed
    const input: DeleteRecordInput = {
      id: record.id
    };

    const result = await deleteMaintenanceRecord(input);
    expect(result.success).toBe(true);

    // Attempting to delete again should still return success (idempotent)
    const result2 = await deleteMaintenanceRecord(input);
    expect(result2.success).toBe(true);
  });
});
