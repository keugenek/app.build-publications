import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type UpdateMaintenanceEntryInput } from '../schema';
import { updateMaintenanceEntry } from '../handlers/update_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test data
const testCarData = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  vin: '12345678901234567'
};

describe('updateMaintenanceEntry', () => {
  beforeEach(async () => {
    await createDB();
    // Create a car first as maintenance entry needs a valid carId
    const carResult = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    // Store the carId for use in tests
    (testCarData as any).id = carResult[0].id;
  });
  
  afterEach(resetDB);

  it('should update a maintenance entry with all fields', async () => {
    // Create a maintenance entry first
    const entryResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: (testCarData as any).id,
        dateOfService: '2023-01-15',
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    const entryId = entryResult[0].id;
    
    // Update all fields
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      carId: (testCarData as any).id,
      dateOfService: new Date('2023-02-20'),
      serviceType: 'Tire Rotation',
      cost: 89.99,
      mileage: 16000,
      notes: 'Rotated all tires'
    };
    
    const result = await updateMaintenanceEntry(updateInput);
    
    // Validate the updated fields
    expect(result.id).toEqual(entryId);
    expect(result.carId).toEqual(updateInput.carId!);
    expect(result.dateOfService).toEqual(updateInput.dateOfService!);
    expect(result.serviceType).toEqual(updateInput.serviceType!);
    expect(result.cost).toEqual(updateInput.cost!);
    expect(result.mileage).toEqual(updateInput.mileage!);
    expect(result.notes).toEqual(updateInput.notes!);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.cost).toBe('number'); // Ensure proper numeric conversion
  });

  it('should update a maintenance entry with partial fields', async () => {
    // Create a maintenance entry first
    const entryResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: (testCarData as any).id,
        dateOfService: '2023-01-15',
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    const entryId = entryResult[0].id;
    
    // Update only service type and cost
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      serviceType: 'Brake Service',
      cost: 199.99
    };
    
    const result = await updateMaintenanceEntry(updateInput);
    
    // Validate the updated fields
    expect(result.id).toEqual(entryId);
    expect(result.serviceType).toEqual(updateInput.serviceType!);
    expect(result.cost).toEqual(updateInput.cost!);
    
    // Ensure other fields remain unchanged
    expect(result.carId).toEqual((testCarData as any).id);
    expect(result.dateOfService).toEqual(new Date('2023-01-15'));
    expect(result.mileage).toEqual(15000);
    expect(result.notes).toEqual('Regular oil change');
    expect(typeof result.cost).toBe('number'); // Ensure proper numeric conversion
  });

  it('should save updated maintenance entry to database', async () => {
    // Create a maintenance entry first
    const entryResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: (testCarData as any).id,
        dateOfService: '2023-01-15',
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    const entryId = entryResult[0].id;
    
    // Update the entry
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      serviceType: 'Transmission Service',
      cost: 299.99
    };
    
    await updateMaintenanceEntry(updateInput);
    
    // Query database to verify update
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, entryId))
      .execute();
    
    expect(entries).toHaveLength(1);
    expect(entries[0].serviceType).toEqual(updateInput.serviceType!);
    expect(parseFloat(entries[0].cost)).toEqual(updateInput.cost!);
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when maintenance entry does not exist', async () => {
    const updateInput: UpdateMaintenanceEntryInput = {
      id: 99999,
      serviceType: 'Non-existent entry'
    };
    
    await expect(updateMaintenanceEntry(updateInput))
      .rejects
      .toThrow(/not found/);
  });

  it('should throw an error when car does not exist', async () => {
    // Create a maintenance entry first
    const entryResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: (testCarData as any).id,
        dateOfService: '2023-01-15',
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    const entryId = entryResult[0].id;
    
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      carId: 99999 // Non-existent car ID
    };
    
    await expect(updateMaintenanceEntry(updateInput))
      .rejects
      .toThrow(/not found/);
  });

  it('should handle null notes correctly', async () => {
    // Create a maintenance entry first
    const entryResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: (testCarData as any).id,
        dateOfService: '2023-01-15',
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .returning()
      .execute();
    const entryId = entryResult[0].id;
    
    // Update notes to null
    const updateInput: UpdateMaintenanceEntryInput = {
      id: entryId,
      notes: null
    };
    
    const result = await updateMaintenanceEntry(updateInput);
    
    expect(result.notes).toBeNull();
  });
});
