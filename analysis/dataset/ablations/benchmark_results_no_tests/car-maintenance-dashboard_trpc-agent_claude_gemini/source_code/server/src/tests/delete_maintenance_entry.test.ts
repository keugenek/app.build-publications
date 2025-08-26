import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteMaintenanceEntryInput, type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { deleteMaintenanceEntry } from '../handlers/delete_maintenance_entry';

// Test car data
const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  license_plate: 'ABC-123',
  current_mileage: 15000
};

// Test maintenance entry data
const testMaintenanceEntry: Omit<CreateMaintenanceEntryInput, 'car_id'> = {
  service_date: new Date('2024-01-15'),
  service_type: 'Oil Change',
  description: 'Regular oil change service',
  cost: 45.99,
  mileage_at_service: 15000
};

describe('deleteMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing maintenance entry', async () => {
    // Create car first
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance entry
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: testMaintenanceEntry.description,
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const maintenanceEntryId = maintenanceResult[0].id;

    // Delete the maintenance entry
    const deleteInput: DeleteMaintenanceEntryInput = {
      id: maintenanceEntryId
    };

    const result = await deleteMaintenanceEntry(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify the entry is deleted from database
    const remainingEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntryId))
      .execute();

    expect(remainingEntries).toHaveLength(0);
  });

  it('should return false when deleting non-existent maintenance entry', async () => {
    const deleteInput: DeleteMaintenanceEntryInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteMaintenanceEntry(deleteInput);

    // Should return false for non-existent entry
    expect(result.success).toBe(false);
  });

  it('should not affect other maintenance entries when deleting one', async () => {
    // Create car first
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create multiple maintenance entries
    const entry1Result = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: testMaintenanceEntry.service_date,
        service_type: 'Oil Change',
        description: 'First entry',
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const entry2Result = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: new Date('2024-02-15'),
        service_type: 'Tire Rotation',
        description: 'Second entry',
        cost: '25.00',
        mileage_at_service: 16000
      })
      .returning()
      .execute();

    const entryToDeleteId = entry1Result[0].id;
    const entryToKeepId = entry2Result[0].id;

    // Delete first entry
    const deleteInput: DeleteMaintenanceEntryInput = {
      id: entryToDeleteId
    };

    const result = await deleteMaintenanceEntry(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify only the targeted entry was deleted
    const deletedEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, entryToDeleteId))
      .execute();

    expect(deletedEntries).toHaveLength(0);

    // Verify other entry still exists
    const remainingEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, entryToKeepId))
      .execute();

    expect(remainingEntries).toHaveLength(1);
    expect(remainingEntries[0].service_type).toEqual('Tire Rotation');
    expect(remainingEntries[0].description).toEqual('Second entry');
  });

  it('should verify database state after successful deletion', async () => {
    // Create car first
    const carResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance entry
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: testMaintenanceEntry.service_date,
        service_type: testMaintenanceEntry.service_type,
        description: testMaintenanceEntry.description,
        cost: testMaintenanceEntry.cost.toString(),
        mileage_at_service: testMaintenanceEntry.mileage_at_service
      })
      .returning()
      .execute();

    const maintenanceEntryId = maintenanceResult[0].id;

    // Count entries before deletion
    const beforeCount = await db.select()
      .from(maintenanceEntriesTable)
      .execute();

    expect(beforeCount).toHaveLength(1);

    // Delete the maintenance entry
    const deleteInput: DeleteMaintenanceEntryInput = {
      id: maintenanceEntryId
    };

    const result = await deleteMaintenanceEntry(deleteInput);

    expect(result.success).toBe(true);

    // Count entries after deletion
    const afterCount = await db.select()
      .from(maintenanceEntriesTable)
      .execute();

    expect(afterCount).toHaveLength(0);
  });
});
