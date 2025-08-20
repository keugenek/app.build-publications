import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceHistoryTable } from '../db/schema';
import { type UpdateMaintenanceHistoryInput } from '../schema';
import { updateMaintenanceHistory } from '../handlers/update_maintenance_history';
import { eq } from 'drizzle-orm';

describe('updateMaintenanceHistory', () => {
  let testCarId: number;
  let testMaintenanceId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186'
      })
      .returning()
      .execute();
    
    testCarId = carResult[0].id;

    // Create a test maintenance history record
    const maintenanceResult = await db.insert(maintenanceHistoryTable)
      .values({
        car_id: testCarId,
        service_date: new Date('2024-01-15'),
        service_type: 'Oil Change',
        mileage: 50000,
        cost: '75.50', // String for numeric column
        notes: 'Regular maintenance'
      })
      .returning()
      .execute();
    
    testMaintenanceId = maintenanceResult[0].id;
  });

  afterEach(resetDB);

  it('should update all provided fields', async () => {
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      service_date: new Date('2024-02-20'),
      service_type: 'Tire Rotation',
      mileage: 52000,
      cost: 95.75,
      notes: 'Updated maintenance record'
    };

    const result = await updateMaintenanceHistory(updateInput);

    expect(result.id).toEqual(testMaintenanceId);
    expect(result.car_id).toEqual(testCarId);
    expect(result.service_date).toEqual(new Date('2024-02-20'));
    expect(result.service_type).toEqual('Tire Rotation');
    expect(result.mileage).toEqual(52000);
    expect(result.cost).toEqual(95.75);
    expect(typeof result.cost).toEqual('number');
    expect(result.notes).toEqual('Updated maintenance record');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields (partial update)', async () => {
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      service_type: 'Brake Inspection',
      cost: 120.00
    };

    const result = await updateMaintenanceHistory(updateInput);

    expect(result.id).toEqual(testMaintenanceId);
    expect(result.service_type).toEqual('Brake Inspection');
    expect(result.cost).toEqual(120.00);
    expect(typeof result.cost).toEqual('number');
    
    // These fields should remain unchanged
    expect(result.service_date).toEqual(new Date('2024-01-15'));
    expect(result.mileage).toEqual(50000);
    expect(result.notes).toEqual('Regular maintenance');
  });

  it('should handle null notes correctly', async () => {
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      notes: null
    };

    const result = await updateMaintenanceHistory(updateInput);

    expect(result.notes).toBeNull();
    expect(result.service_type).toEqual('Oil Change'); // Unchanged
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      service_type: 'Filter Replacement',
      mileage: 51000,
      cost: 85.25
    };

    await updateMaintenanceHistory(updateInput);

    // Verify changes were persisted
    const records = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, testMaintenanceId))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].service_type).toEqual('Filter Replacement');
    expect(records[0].mileage).toEqual(51000);
    expect(parseFloat(records[0].cost)).toEqual(85.25);
  });

  it('should throw error for non-existent maintenance history record', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: nonExistentId,
      service_type: 'Oil Change'
    };

    expect(updateMaintenanceHistory(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle edge case with zero cost', async () => {
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      cost: 0
    };

    const result = await updateMaintenanceHistory(updateInput);

    expect(result.cost).toEqual(0);
    expect(typeof result.cost).toEqual('number');
  });

  it('should handle very large cost values', async () => {
    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      cost: 9999.99
    };

    const result = await updateMaintenanceHistory(updateInput);

    expect(result.cost).toEqual(9999.99);
    expect(typeof result.cost).toEqual('number');
  });

  it('should preserve original created_at timestamp', async () => {
    // Get original created_at
    const originalRecord = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, testMaintenanceId))
      .execute();

    const originalCreatedAt = originalRecord[0].created_at;

    const updateInput: UpdateMaintenanceHistoryInput = {
      id: testMaintenanceId,
      service_type: 'Updated Service'
    };

    const result = await updateMaintenanceHistory(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
