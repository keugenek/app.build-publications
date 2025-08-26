import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteMaintenanceEntry } from '../handlers/delete_maintenance_entry';

describe('deleteMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing maintenance entry', async () => {
    // First create a car to associate with the maintenance entry
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        vin: '12345678901234567',
        nextServiceDate: null,
        nextServiceMileage: null
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create a maintenance entry
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: carId,
        dateOfService: '2023-01-15', // Pass as string, not Date object
        serviceType: 'Oil Change',
        cost: '29.99', // Stored as string for numeric column
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    
    const maintenanceEntryId = maintenanceResult[0].id;
    
    // Verify the maintenance entry exists before deletion
    const beforeDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntryId))
      .execute();
    
    expect(beforeDelete).toHaveLength(1);
    expect(beforeDelete[0].id).toBe(maintenanceEntryId);
    
    // Delete the maintenance entry
    const result = await deleteMaintenanceEntry(maintenanceEntryId);
    
    // Verify the deletion was successful
    expect(result).toBe(true);
    
    // Verify the maintenance entry no longer exists
    const afterDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntryId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent maintenance entry', async () => {
    // Try to delete a maintenance entry that doesn't exist
    const result = await deleteMaintenanceEntry(99999);
    
    // Should return false since no record was deleted
    expect(result).toBe(false);
  });
});
