import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { deleteMaintenanceEntry } from '../handlers/delete_maintenance_entry';
import { eq } from 'drizzle-orm';

describe('deleteMaintenanceEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing maintenance entry', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create a test maintenance entry
    const maintenanceResult = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: new Date('2024-01-15'),
        mileage: 50000,
        service_type: 'oil_change',
        cost: '59.99',
        notes: 'Regular oil change service'
      })
      .returning()
      .execute();
    const maintenanceEntry = maintenanceResult[0];

    // Delete the maintenance entry
    const result = await deleteMaintenanceEntry(maintenanceEntry.id);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the record no longer exists in the database
    const deletedEntry = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, maintenanceEntry.id))
      .execute();

    expect(deletedEntry).toHaveLength(0);
  });

  it('should return success false when deleting non-existent maintenance entry', async () => {
    // Try to delete a maintenance entry with an ID that doesn't exist
    const result = await deleteMaintenanceEntry(99999);

    // Verify unsuccessful deletion
    expect(result.success).toBe(false);
  });

  it('should not affect other maintenance entries when deleting one', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create multiple maintenance entries
    const maintenanceResults = await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car.id,
          service_date: new Date('2024-01-15'),
          mileage: 25000,
          service_type: 'oil_change',
          cost: '59.99',
          notes: 'First oil change'
        },
        {
          car_id: car.id,
          service_date: new Date('2024-02-15'),
          mileage: 27500,
          service_type: 'tire_rotation',
          cost: '39.99',
          notes: 'Tire rotation service'
        },
        {
          car_id: car.id,
          service_date: new Date('2024-03-15'),
          mileage: 30000,
          service_type: 'brake_service',
          cost: '199.99',
          notes: 'Brake pad replacement'
        }
      ])
      .returning()
      .execute();

    const [entry1, entry2, entry3] = maintenanceResults;

    // Delete the middle entry
    const result = await deleteMaintenanceEntry(entry2.id);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify only the target entry was deleted
    const remainingEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car.id))
      .execute();

    expect(remainingEntries).toHaveLength(2);
    
    // Verify the correct entries remain
    const remainingIds = remainingEntries.map(entry => entry.id);
    expect(remainingIds).toContain(entry1.id);
    expect(remainingIds).toContain(entry3.id);
    expect(remainingIds).not.toContain(entry2.id);
  });

  it('should handle deletion with all maintenance entry types', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2019,
        license_plate: 'TRUCK01'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create maintenance entries with different service types
    const maintenanceResults = await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car.id,
          service_date: new Date('2024-01-10'),
          mileage: 45000,
          service_type: 'engine_tune_up',
          cost: '299.99',
          notes: 'Complete engine tune-up'
        },
        {
          car_id: car.id,
          service_date: new Date('2024-02-20'),
          mileage: 47000,
          service_type: 'inspection',
          cost: '25.00',
          notes: null // Test nullable notes
        }
      ])
      .returning()
      .execute();

    // Delete each entry and verify
    for (const entry of maintenanceResults) {
      const result = await deleteMaintenanceEntry(entry.id);
      expect(result.success).toBe(true);

      // Verify deletion from database
      const deletedEntry = await db.select()
        .from(maintenanceEntriesTable)
        .where(eq(maintenanceEntriesTable.id, entry.id))
        .execute();

      expect(deletedEntry).toHaveLength(0);
    }
  });
});
