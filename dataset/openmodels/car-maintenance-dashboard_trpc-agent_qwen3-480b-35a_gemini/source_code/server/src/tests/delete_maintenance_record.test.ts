import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteMaintenanceRecord } from '../handlers/delete_maintenance_record';

describe('deleteMaintenanceRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing maintenance record', async () => {
    // First create a car to reference
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        vin: '12345678901234567'
      })
      .returning()
      .execute();
    
    const car = carResult[0];
    
    // Create a maintenance record
    const maintenanceResult = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_type: 'Oil Change',
        date: '2023-01-15',
        mileage: 15000,
        cost: '45.99',
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    
    const maintenanceRecord = maintenanceResult[0];
    
    // Delete the maintenance record
    const result = await deleteMaintenanceRecord(maintenanceRecord.id);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify record no longer exists in database
    const records = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, maintenanceRecord.id))
      .execute();
    
    expect(records).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent maintenance record', async () => {
    // Try to delete a maintenance record that doesn't exist
    const result = await deleteMaintenanceRecord(99999);
    
    // Should return false since no record was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified maintenance record', async () => {
    // First create a car to reference
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789',
        vin: '78945612301234567'
      })
      .returning()
      .execute();
    
    const car = carResult[0];
    
    // Create multiple maintenance records
    const maintenanceResult1 = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_type: 'Tire Rotation',
        date: '2023-02-10',
        mileage: 20000,
        cost: '25.50'
      })
      .returning()
      .execute();
    
    const maintenanceResult2 = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car.id,
        service_type: 'Brake Inspection',
        date: '2023-03-15',
        mileage: 25000,
        cost: '89.99',
        notes: 'Check front brake pads'
      })
      .returning()
      .execute();
    
    const record1 = maintenanceResult1[0];
    const record2 = maintenanceResult2[0];
    
    // Delete only the first record
    const result = await deleteMaintenanceRecord(record1.id);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify first record no longer exists
    const records1 = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, record1.id))
      .execute();
    
    expect(records1).toHaveLength(0);
    
    // Verify second record still exists
    const records2 = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, record2.id))
      .execute();
    
    expect(records2).toHaveLength(1);
    expect(records2[0].id).toBe(record2.id);
  });
});
