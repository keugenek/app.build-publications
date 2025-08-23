import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type UpdateMaintenanceEntryInput, type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { updateMaintenanceEntry } from '../handlers/update_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test data
const testCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '12345678901234567',
  current_mileage: 15000
};

const testMaintenanceEntryInput: CreateMaintenanceEntryInput = {
  car_id: 1,
  date: new Date('2023-01-15'),
  service_type: 'Oil Change',
  cost: 49.99,
  mileage_at_service: 15000,
  notes: 'Regular maintenance'
};

describe('updateMaintenanceEntry', () => {
  beforeEach(async () => {
    await createDB();
    // Create a car first since maintenance entry references it
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();
    
    // Create a maintenance entry
    await db.insert(maintenanceEntriesTable)
      .values({
        ...testMaintenanceEntryInput,
        car_id: carResult[0].id,
        cost: testMaintenanceEntryInput.cost.toString()
      })
      .returning()
      .execute();
  });
  
  afterEach(resetDB);

  it('should update a maintenance entry with all fields', async () => {
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.service_type, 'Oil Change'))
      .execute();
    
    const entryId = entries[0].id;
    
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      date: new Date('2023-02-20'),
      service_type: 'Tire Rotation',
      cost: 89.99,
      mileage_at_service: 16000,
      notes: 'Rotated all tires'
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Validate returned data
    expect(result.id).toEqual(entryId);
    expect(result.date.getTime()).toEqual(updateInput.date!.getTime());
    expect(result.service_type).toEqual('Tire Rotation');
    expect(result.cost).toEqual(89.99);
    expect(result.mileage_at_service).toEqual(16000);
    expect(result.notes).toEqual('Rotated all tires');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify updated_at was actually updated
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update a maintenance entry with partial fields', async () => {
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.service_type, 'Oil Change'))
      .execute();
    
    const entryId = entries[0].id;
    
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      cost: 59.99,
      notes: 'Updated price'
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Validate that updated fields changed
    expect(result.id).toEqual(entryId);
    expect(result.cost).toEqual(59.99);
    expect(result.notes).toEqual('Updated price');
    
    // Validate that non-updated fields remained the same
    expect(result.service_type).toEqual('Oil Change');
    expect(result.mileage_at_service).toEqual(15000);
  });

  it('should save updated maintenance entry to database', async () => {
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.service_type, 'Oil Change'))
      .execute();
    
    const entryId = entries[0].id;
    
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      service_type: 'Brake Inspection',
      cost: 120.50
    };

    await updateMaintenanceEntry(updateInput);

    // Query the updated record
    const updatedEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, entryId))
      .execute();

    expect(updatedEntries).toHaveLength(1);
    expect(updatedEntries[0].service_type).toEqual('Brake Inspection');
    expect(parseFloat(updatedEntries[0].cost)).toEqual(120.50);
    expect(updatedEntries[0].updated_at.getTime()).toBeGreaterThan(updatedEntries[0].created_at.getTime());
  });

  it('should throw an error when updating a non-existent maintenance entry', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: 99999, // Non-existent ID
      service_type: 'Non-existent Entry'
    };

    await expect(updateMaintenanceEntry(updateInput))
      .rejects
      .toThrow(/not found/);
  });

  it('should handle null notes correctly', async () => {
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.service_type, 'Oil Change'))
      .execute();
    
    const entryId = entries[0].id;
    
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      notes: null
    };

    const result = await updateMaintenanceEntry(updateInput);

    expect(result.notes).toBeNull();
  });

  it('should handle numeric conversion correctly', async () => {
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.service_type, 'Oil Change'))
      .execute();
    
    const entryId = entries[0].id;
    
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      cost: 75.25
    };

    const result = await updateMaintenanceEntry(updateInput);

    // Check that cost is returned as a number (not string)
    expect(typeof result.cost).toBe('number');
    expect(result.cost).toBe(75.25);
  });
});
