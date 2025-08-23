import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { getMaintenanceEntries } from '../handlers/get_maintenance_entries';
import { eq } from 'drizzle-orm';

// Test data
const testCarInput: any = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  vin: '12345678901234567',
  nextServiceDate: null,
  nextServiceMileage: null
};

const testCarInput2: any = {
  make: 'Honda',
  model: 'Civic',
  year: 2019,
  licensePlate: 'XYZ789',
  vin: '76543210987654321',
  nextServiceDate: null,
  nextServiceMileage: null
};

describe('getMaintenanceEntries', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test cars first
    const [car1Result] = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();
    
    const [car2Result] = await db.insert(carsTable)
      .values(testCarInput2)
      .returning()
      .execute();
    
    // Create test maintenance entries for car 1
    await db.insert(maintenanceEntriesTable)
      .values({
        carId: car1Result.id,
        dateOfService: '2023-01-15',
        serviceType: 'Oil Change',
        cost: '49.99',
        mileage: 15000,
        notes: 'Regular oil change'
      })
      .execute();
      
    await db.insert(maintenanceEntriesTable)
      .values({
        carId: car1Result.id,
        dateOfService: '2023-07-20',
        serviceType: 'Tire Rotation',
        cost: '29.99',
        mileage: 17500,
        notes: null
      })
      .execute();
      
    // Create test maintenance entry for car 2
    await db.insert(maintenanceEntriesTable)
      .values({
        carId: car2Result.id,
        dateOfService: '2023-03-10',
        serviceType: 'Brake Service',
        cost: '199.99',
        mileage: 16000,
        notes: 'Front brake pads replaced'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all maintenance entries when no carId is provided', async () => {
    const results = await getMaintenanceEntries();
    
    expect(results).toHaveLength(3);
    
    // Check that all entries have the correct structure and data types
    results.forEach(entry => {
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.carId).toBe('number');
      expect(entry.dateOfService).toBeInstanceOf(Date);
      expect(typeof entry.serviceType).toBe('string');
      expect(typeof entry.cost).toBe('number');
      expect(typeof entry.mileage).toBe('number');
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should fetch maintenance entries for a specific car when carId is provided', async () => {
    // Get the first car's ID
    const cars = await db.select().from(carsTable).where(eq(carsTable.make, 'Toyota')).execute();
    const carId = cars[0].id;
    
    const results = await getMaintenanceEntries(carId);
    
    expect(results).toHaveLength(2);
    
    // Check that all entries belong to the correct car
    results.forEach(entry => {
      expect(entry.carId).toBe(carId);
      expect(typeof entry.cost).toBe('number'); // Verify numeric conversion
    });
    
    // Check specific data
    const oilChangeEntry = results.find(entry => entry.serviceType === 'Oil Change');
    expect(oilChangeEntry).toBeDefined();
    expect(oilChangeEntry!.cost).toBe(49.99);
    expect(oilChangeEntry!.mileage).toBe(15000);
    
    const tireRotationEntry = results.find(entry => entry.serviceType === 'Tire Rotation');
    expect(tireRotationEntry).toBeDefined();
    expect(tireRotationEntry!.cost).toBe(29.99);
    expect(tireRotationEntry!.mileage).toBe(17500);
  });

  it('should return an empty array when no maintenance entries exist for a car', async () => {
    // Create a new car with no maintenance entries
    const [newCar] = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        licensePlate: 'DEF456',
        vin: '12345678909876543',
        nextServiceDate: null,
        nextServiceMileage: null
      })
      .returning()
      .execute();
    
    const results = await getMaintenanceEntries(newCar.id);
    
    expect(results).toHaveLength(0);
  });

  it('should return an empty array when carId does not exist', async () => {
    const results = await getMaintenanceEntries(99999);
    
    expect(results).toHaveLength(0);
  });
});
