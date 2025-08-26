import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { getMaintenanceEntry } from '../handlers/get_maintenance_entry';
import { eq } from 'drizzle-orm';

// Test data
const testCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1234567890ABCDEFG',
  current_mileage: 15000
};

const testMaintenanceEntryInput: CreateMaintenanceEntryInput = {
  car_id: 1, // Will be updated after car creation
  date: new Date('2023-01-15'),
  service_type: 'Oil Change',
  cost: 49.99,
  mileage_at_service: 15000,
  notes: 'Regular oil change'
};

// Helper function to convert CreateMaintenanceEntryInput to database insert format
const convertToDbFormat = (input: CreateMaintenanceEntryInput) => {
  return {
    car_id: input.car_id,
    date: input.date,
    service_type: input.service_type,
    cost: input.cost.toString(),
    mileage_at_service: input.mileage_at_service,
    notes: input.notes ?? null
  };
};

describe('getMaintenanceEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();
    
    // Update the car_id in maintenance entry input
    (testMaintenanceEntryInput as any).car_id = carResult[0].id;
  });
  
  afterEach(resetDB);

  it('should fetch an existing maintenance entry by ID', async () => {
    // First create a maintenance entry
    const createdEntry = await db.insert(maintenanceEntriesTable)
      .values(convertToDbFormat(testMaintenanceEntryInput))
      .returning()
      .execute();

    const entryId = createdEntry[0].id;
    
    // Now fetch it using our handler
    const result = await getMaintenanceEntry(entryId);
    
    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(entryId);
    expect(result!.car_id).toEqual(testMaintenanceEntryInput.car_id);
    expect(result!.date).toEqual(testMaintenanceEntryInput.date);
    expect(result!.service_type).toEqual(testMaintenanceEntryInput.service_type);
    expect(result!.cost).toEqual(testMaintenanceEntryInput.cost); // Should be number, not string
    expect(result!.mileage_at_service).toEqual(testMaintenanceEntryInput.mileage_at_service);
    expect(result!.notes).toEqual(testMaintenanceEntryInput.notes ?? null);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent maintenance entry', async () => {
    const result = await getMaintenanceEntry(99999); // Non-existent ID
    expect(result).toBeNull();
  });

  it('should handle maintenance entry with null notes', async () => {
    // Create a maintenance entry with null notes
    const entryWithNullNotes: CreateMaintenanceEntryInput = {
      car_id: testMaintenanceEntryInput.car_id,
      date: testMaintenanceEntryInput.date,
      service_type: 'Tire Rotation',
      cost: testMaintenanceEntryInput.cost,
      mileage_at_service: testMaintenanceEntryInput.mileage_at_service,
      notes: null
    };
    
    const createdEntry = await db.insert(maintenanceEntriesTable)
      .values(convertToDbFormat(entryWithNullNotes))
      .returning()
      .execute();

    const entryId = createdEntry[0].id;
    
    // Fetch it using our handler
    const result = await getMaintenanceEntry(entryId);
    
    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(entryId);
    expect(result!.service_type).toEqual('Tire Rotation');
    expect(result!.notes).toBeNull();
    expect(result!.cost).toEqual(entryWithNullNotes.cost);
  });

  it('should properly convert numeric cost field', async () => {
    // Create a maintenance entry with decimal cost
    const entryWithDecimalCost: CreateMaintenanceEntryInput = {
      car_id: testMaintenanceEntryInput.car_id,
      date: testMaintenanceEntryInput.date,
      service_type: 'Brake Service',
      cost: 123.45,
      mileage_at_service: testMaintenanceEntryInput.mileage_at_service,
      notes: testMaintenanceEntryInput.notes
    };
    
    const createdEntry = await db.insert(maintenanceEntriesTable)
      .values(convertToDbFormat(entryWithDecimalCost))
      .returning()
      .execute();

    const entryId = createdEntry[0].id;
    
    // Fetch it using our handler
    const result = await getMaintenanceEntry(entryId);
    
    // Verify the cost is properly converted back to number
    expect(result).not.toBeNull();
    expect(typeof result!.cost).toEqual('number');
    expect(result!.cost).toEqual(123.45);
  });

  it('should correctly handle Date objects', async () => {
    const specificDate = new Date('2023-06-20T14:30:00Z');
    
    // Create a maintenance entry with specific date
    const entryWithDate: CreateMaintenanceEntryInput = {
      car_id: testMaintenanceEntryInput.car_id,
      date: specificDate,
      service_type: 'Alignment',
      cost: testMaintenanceEntryInput.cost,
      mileage_at_service: testMaintenanceEntryInput.mileage_at_service,
      notes: testMaintenanceEntryInput.notes
    };
    
    const createdEntry = await db.insert(maintenanceEntriesTable)
      .values(convertToDbFormat(entryWithDate))
      .returning()
      .execute();

    const entryId = createdEntry[0].id;
    
    // Fetch it using our handler
    const result = await getMaintenanceEntry(entryId);
    
    // Verify dates are properly handled
    expect(result).not.toBeNull();
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.getTime()).toEqual(specificDate.getTime());
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
