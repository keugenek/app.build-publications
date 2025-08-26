import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { createCarInputSchema, createMaintenanceEntryInputSchema } from '../schema';
import { deleteMaintenanceEntry } from '../handlers/delete_maintenance_entry';
import { eq } from 'drizzle-orm';

describe('deleteMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing maintenance entry', async () => {
    // First create a car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '12345678901234567',
        current_mileage: 15000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Then create a maintenance entry for that car
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        date: new Date('2023-01-15'),
        service_type: 'Oil Change',
        cost: '45.99',
        mileage_at_service: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();

    const maintenanceEntryId = maintenanceResult[0].id;

    // Verify the maintenance entry exists before deletion
    const beforeDeletion = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntryId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);

    // Delete the maintenance entry
    const result = await deleteMaintenanceEntry(maintenanceEntryId);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify the maintenance entry no longer exists
    const afterDeletion = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntryId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent maintenance entry', async () => {
    // Try to delete a maintenance entry that doesn't exist
    const result = await deleteMaintenanceEntry(99999);

    // Should return false
    expect(result).toBe(false);
  });

  it('should only delete the specified maintenance entry', async () => {
    // First create a car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: '12345678901234568',
        current_mileage: 25000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create two maintenance entries
    const maintenanceResult1 = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        date: new Date('2023-01-15'),
        service_type: 'Oil Change',
        cost: '45.99',
        mileage_at_service: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();

    const maintenanceResult2 = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        date: new Date('2023-07-15'),
        service_type: 'Tire Rotation',
        cost: '25.00',
        mileage_at_service: 20000,
        notes: 'Rotated all tires'
      })
      .returning()
      .execute();

    const entryId1 = maintenanceResult1[0].id;
    const entryId2 = maintenanceResult2[0].id;

    // Verify both entries exist
    const beforeDeletion = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, carId))
      .execute();

    expect(beforeDeletion).toHaveLength(2);

    // Delete only the first entry
    const result = await deleteMaintenanceEntry(entryId1);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify only one entry remains
    const afterDeletion = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, carId))
      .execute();

    expect(afterDeletion).toHaveLength(1);
    expect(afterDeletion[0].id).toBe(entryId2); // The second entry should still be there
  });
});
