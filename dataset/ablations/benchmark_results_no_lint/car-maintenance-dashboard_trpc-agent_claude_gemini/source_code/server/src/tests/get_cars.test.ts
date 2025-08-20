import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { getCars } from '../handlers/get_cars';

// Test car data
const testCar1: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '12345678901234567'
};

const testCar2: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  vin: '98765432109876543'
};

const testCar3: CreateCarInput = {
  make: 'Ford',
  model: 'F-150',
  year: 2019,
  vin: '11111222223333344'
};

describe('getCars', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cars exist', async () => {
    const result = await getCars();
    
    expect(result).toBeArray();
    expect(result).toHaveLength(0);
  });

  it('should return single car when one exists', async () => {
    // Create test car
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(1);
    expect(result[0].make).toEqual('Toyota');
    expect(result[0].model).toEqual('Camry');
    expect(result[0].year).toEqual(2020);
    expect(result[0].vin).toEqual('12345678901234567');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple cars when they exist', async () => {
    // Create multiple test cars
    await db.insert(carsTable)
      .values([testCar1, testCar2, testCar3])
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(3);
    
    // Verify all cars have required fields
    result.forEach(car => {
      expect(car.id).toBeDefined();
      expect(car.make).toBeDefined();
      expect(car.model).toBeDefined();
      expect(car.year).toBeDefined();
      expect(car.vin).toBeDefined();
      expect(car.created_at).toBeInstanceOf(Date);
    });

    // Check specific car data
    const makes = result.map(car => car.make);
    expect(makes).toContain('Toyota');
    expect(makes).toContain('Honda');
    expect(makes).toContain('Ford');
  });

  it('should order cars by creation date ascending', async () => {
    // Insert cars with slight delay to ensure different timestamps
    await db.insert(carsTable).values(testCar1).execute();
    
    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(carsTable).values(testCar2).execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(carsTable).values(testCar3).execute();

    const result = await getCars();

    expect(result).toHaveLength(3);
    
    // Verify ascending order by created_at
    expect(result[0].created_at <= result[1].created_at).toBe(true);
    expect(result[1].created_at <= result[2].created_at).toBe(true);
    
    // First car should be Toyota (inserted first)
    expect(result[0].make).toEqual('Toyota');
    // Last car should be Ford (inserted last)
    expect(result[2].make).toEqual('Ford');
  });

  it('should return cars with correct data types', async () => {
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    const result = await getCars();
    const car = result[0];

    expect(typeof car.id).toBe('number');
    expect(typeof car.make).toBe('string');
    expect(typeof car.model).toBe('string');
    expect(typeof car.year).toBe('number');
    expect(typeof car.vin).toBe('string');
    expect(car.created_at).toBeInstanceOf(Date);
  });

  it('should handle large number of cars', async () => {
    // Create array of test cars
    const manyCars = Array.from({ length: 50 }, (_, index) => ({
      make: `Make${index}`,
      model: `Model${index}`,
      year: 2000 + (index % 24), // Years from 2000-2023
      vin: `VIN${index.toString().padStart(14, '0')}`
    }));

    await db.insert(carsTable)
      .values(manyCars)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(50);
    
    // Verify ordering is maintained
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].created_at <= result[i].created_at).toBe(true);
    }
  });
});
