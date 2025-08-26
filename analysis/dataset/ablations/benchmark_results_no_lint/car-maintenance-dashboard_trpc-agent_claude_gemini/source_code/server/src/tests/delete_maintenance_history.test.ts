import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceHistoryTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteMaintenanceHistory } from '../handlers/delete_maintenance_history';
import { type DeleteByIdInput } from '../schema';

describe('deleteMaintenanceHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing maintenance history record and return true', async () => {
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

    const carId = carResult[0].id;

    // Create a maintenance history record
    const maintenanceResult = await db.insert(maintenanceHistoryTable)
      .values({
        car_id: carId,
        service_date: new Date('2023-01-15'),
        service_type: 'Oil Change',
        mileage: 25000,
        cost: '49.99', // Store as string for numeric column
        notes: 'Regular maintenance'
      })
      .returning()
      .execute();

    const maintenanceId = maintenanceResult[0].id;

    // Test input
    const input: DeleteByIdInput = {
      id: maintenanceId
    };

    // Delete the maintenance history record
    const result = await deleteMaintenanceHistory(input);

    expect(result).toBe(true);

    // Verify the record was actually deleted from database
    const remainingRecords = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, maintenanceId))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent maintenance history record', async () => {
    const nonExistentId = 99999;
    
    const input: DeleteByIdInput = {
      id: nonExistentId
    };

    const result = await deleteMaintenanceHistory(input);

    expect(result).toBe(false);
  });

  it('should not affect other maintenance history records when deleting one', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '2HGFC2F59MH123456'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create multiple maintenance history records
    const maintenanceResults = await db.insert(maintenanceHistoryTable)
      .values([
        {
          car_id: carId,
          service_date: new Date('2023-01-15'),
          service_type: 'Oil Change',
          mileage: 25000,
          cost: '49.99',
          notes: 'First service'
        },
        {
          car_id: carId,
          service_date: new Date('2023-06-15'),
          service_type: 'Tire Rotation',
          mileage: 30000,
          cost: '29.99',
          notes: 'Second service'
        },
        {
          car_id: carId,
          service_date: new Date('2023-12-15'),
          service_type: 'Brake Inspection',
          mileage: 35000,
          cost: '75.00',
          notes: 'Third service'
        }
      ])
      .returning()
      .execute();

    const firstMaintenanceId = maintenanceResults[0].id;
    const secondMaintenanceId = maintenanceResults[1].id;
    const thirdMaintenanceId = maintenanceResults[2].id;

    // Delete the middle record
    const input: DeleteByIdInput = {
      id: secondMaintenanceId
    };

    const result = await deleteMaintenanceHistory(input);

    expect(result).toBe(true);

    // Verify only the targeted record was deleted
    const remainingRecords = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, carId))
      .execute();

    expect(remainingRecords).toHaveLength(2);
    
    // Verify the remaining records are the first and third ones
    const remainingIds = remainingRecords.map(record => record.id);
    expect(remainingIds).toContain(firstMaintenanceId);
    expect(remainingIds).toContain(thirdMaintenanceId);
    expect(remainingIds).not.toContain(secondMaintenanceId);
  });

  it('should successfully delete maintenance history record with null notes', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2019,
        vin: '1FTEW1E50MF123456'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance history record with null notes
    const maintenanceResult = await db.insert(maintenanceHistoryTable)
      .values({
        car_id: carId,
        service_date: new Date('2023-03-20'),
        service_type: 'Transmission Service',
        mileage: 45000,
        cost: '199.99',
        notes: null // Explicitly null notes
      })
      .returning()
      .execute();

    const maintenanceId = maintenanceResult[0].id;

    const input: DeleteByIdInput = {
      id: maintenanceId
    };

    const result = await deleteMaintenanceHistory(input);

    expect(result).toBe(true);

    // Verify deletion
    const remainingRecords = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, maintenanceId))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });

  it('should handle deletion of maintenance history with zero cost', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2022,
        vin: '1G1ZD5ST0MF123456'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance history record with zero cost (warranty work)
    const maintenanceResult = await db.insert(maintenanceHistoryTable)
      .values({
        car_id: carId,
        service_date: new Date('2023-08-10'),
        service_type: 'Warranty Repair',
        mileage: 5000,
        cost: '0.00', // Zero cost for warranty work
        notes: 'Covered under warranty'
      })
      .returning()
      .execute();

    const maintenanceId = maintenanceResult[0].id;

    const input: DeleteByIdInput = {
      id: maintenanceId
    };

    const result = await deleteMaintenanceHistory(input);

    expect(result).toBe(true);

    // Verify deletion
    const remainingRecords = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, maintenanceId))
      .execute();

    expect(remainingRecords).toHaveLength(0);
  });
});
