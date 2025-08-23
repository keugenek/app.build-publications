import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { getMaintenanceEntry } from '../handlers/get_maintenance_entry';
import { eq } from 'drizzle-orm';

describe('getMaintenanceEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test car first
    await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        vin: '12345678901234567',
        nextServiceDate: null,
        nextServiceMileage: null
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing maintenance entry by ID', async () => {
    // First create a maintenance entry in the database
    const dbResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: 1,
        dateOfService: new Date('2023-01-15').toISOString().split('T')[0],
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular maintenance'
      })
      .returning()
      .execute();

    const entryId = dbResult[0].id;

    // Now test the handler
    const fetchedEntry = await getMaintenanceEntry(entryId);

    expect(fetchedEntry).not.toBeNull();
    expect(fetchedEntry!.id).toEqual(entryId);
    expect(fetchedEntry!.carId).toEqual(1);
    expect(fetchedEntry!.dateOfService).toEqual(new Date('2023-01-15'));
    expect(fetchedEntry!.serviceType).toEqual('Oil Change');
    expect(fetchedEntry!.cost).toEqual(49.99);
    expect(fetchedEntry!.mileage).toEqual(15000);
    expect(fetchedEntry!.notes).toEqual('Regular maintenance');
    expect(fetchedEntry!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent maintenance entry', async () => {
    const result = await getMaintenanceEntry(99999);
    expect(result).toBeNull();
  });

  it('should properly convert numeric fields', async () => {
    // Create a maintenance entry with specific cost
    const dbResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: 1,
        dateOfService: new Date('2023-01-15').toISOString().split('T')[0],
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular maintenance'
      })
      .returning()
      .execute();

    const entryId = dbResult[0].id;
    const fetchedEntry = await getMaintenanceEntry(entryId);

    expect(fetchedEntry).not.toBeNull();
    expect(typeof fetchedEntry!.cost).toEqual('number');
    expect(fetchedEntry!.cost).toEqual(49.99);
  });

  it('should save maintenance entry to database correctly', async () => {
    // Create a maintenance entry
    const dbResult = await db.insert(maintenanceEntriesTable)
      .values({
        carId: 1,
        dateOfService: new Date('2023-01-15').toISOString().split('T')[0],
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular maintenance'
      })
      .returning()
      .execute();

    const createdEntry = dbResult[0];
    const entryId = createdEntry.id;

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, entryId))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toEqual(entryId);
    expect(entries[0].carId).toEqual(1);
    expect(entries[0].serviceType).toEqual('Oil Change');
    expect(parseFloat(entries[0].cost)).toEqual(49.99);
    expect(entries[0].mileage).toEqual(15000);
  });
});
