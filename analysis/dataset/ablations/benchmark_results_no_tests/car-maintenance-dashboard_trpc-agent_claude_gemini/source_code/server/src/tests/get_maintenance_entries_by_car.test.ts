import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type GetMaintenanceEntriesByCarInput, type CreateCarInput, type CreateMaintenanceEntryInput } from '../schema';
import { getMaintenanceEntriesByCarId } from '../handlers/get_maintenance_entries_by_car';

// Test data
const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  current_mileage: 50000
};

const testMaintenanceEntry1: CreateMaintenanceEntryInput = {
  car_id: 0, // Will be set after car creation
  service_date: new Date('2023-01-15'),
  service_type: 'Oil Change',
  description: 'Regular oil change with filter replacement',
  cost: 45.99,
  mileage_at_service: 45000
};

const testMaintenanceEntry2: CreateMaintenanceEntryInput = {
  car_id: 0, // Will be set after car creation
  service_date: new Date('2023-06-20'),
  service_type: 'Tire Rotation',
  description: 'Rotated all four tires',
  cost: 30.00,
  mileage_at_service: 48000
};

const testMaintenanceEntry3: CreateMaintenanceEntryInput = {
  car_id: 0, // Will be set after car creation
  service_date: new Date('2023-03-10'),
  service_type: 'Brake Inspection',
  description: null,
  cost: 75.50,
  mileage_at_service: 46500
};

describe('getMaintenanceEntriesByCarId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return maintenance entries for a specific car ordered by service date (most recent first)', async () => {
    // Create a car first
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
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          ...testMaintenanceEntry1,
          car_id: carId,
          cost: testMaintenanceEntry1.cost.toString()
        },
        {
          ...testMaintenanceEntry2,
          car_id: carId,
          cost: testMaintenanceEntry2.cost.toString()
        },
        {
          ...testMaintenanceEntry3,
          car_id: carId,
          cost: testMaintenanceEntry3.cost.toString()
        }
      ])
      .execute();

    const input: GetMaintenanceEntriesByCarInput = { carId };
    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(3);
    
    // Verify entries are ordered by service date (most recent first)
    expect(result[0].service_date).toEqual(new Date('2023-06-20'));
    expect(result[1].service_date).toEqual(new Date('2023-03-10'));
    expect(result[2].service_date).toEqual(new Date('2023-01-15'));

    // Verify all fields are properly returned
    expect(result[0].service_type).toEqual('Tire Rotation');
    expect(result[0].cost).toEqual(30.00);
    expect(typeof result[0].cost).toBe('number');
    expect(result[0].mileage_at_service).toEqual(48000);
    expect(result[0].description).toEqual('Rotated all four tires');

    // Verify null description is handled correctly
    expect(result[1].description).toBeNull();

    // Verify all entries belong to the correct car
    result.forEach(entry => {
      expect(entry.car_id).toEqual(carId);
      expect(entry.id).toBeDefined();
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for car with no maintenance entries', async () => {
    // Create a car first
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

    const input: GetMaintenanceEntriesByCarInput = { carId };
    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent car', async () => {
    const input: GetMaintenanceEntriesByCarInput = { carId: 99999 };
    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return entries for the specified car', async () => {
    // Create two cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'CAR001',
        current_mileage: 50000
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'CAR002',
        current_mileage: 30000
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create maintenance entries for both cars
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car1Id,
          service_date: new Date('2023-01-15'),
          service_type: 'Oil Change',
          description: 'Car 1 oil change',
          cost: '45.99',
          mileage_at_service: 45000
        },
        {
          car_id: car2Id,
          service_date: new Date('2023-01-20'),
          service_type: 'Oil Change',
          description: 'Car 2 oil change',
          cost: '50.00',
          mileage_at_service: 28000
        },
        {
          car_id: car1Id,
          service_date: new Date('2023-02-10'),
          service_type: 'Brake Check',
          description: 'Car 1 brake check',
          cost: '75.00',
          mileage_at_service: 46000
        }
      ])
      .execute();

    // Query entries for car 1 only
    const input: GetMaintenanceEntriesByCarInput = { carId: car1Id };
    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(2);
    
    // Verify all entries belong to car 1
    result.forEach(entry => {
      expect(entry.car_id).toEqual(car1Id);
      expect(entry.description).toContain('Car 1');
    });

    // Verify ordering (most recent first)
    expect(result[0].service_date).toEqual(new Date('2023-02-10'));
    expect(result[1].service_date).toEqual(new Date('2023-01-15'));
  });

  it('should handle single maintenance entry correctly', async () => {
    // Create a car first
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

    // Create single maintenance entry
    await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: new Date('2023-01-15'),
        service_type: 'Oil Change',
        description: 'Single entry test',
        cost: testMaintenanceEntry1.cost.toString(),
        mileage_at_service: testMaintenanceEntry1.mileage_at_service
      })
      .execute();

    const input: GetMaintenanceEntriesByCarInput = { carId };
    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].service_type).toEqual('Oil Change');
    expect(result[0].cost).toEqual(45.99);
    expect(typeof result[0].cost).toBe('number');
    expect(result[0].description).toEqual('Single entry test');
  });
});
