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
  license_plate: 'ABC-123',
  current_mileage: 25000
};

const testCar2: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2019,
  license_plate: 'XYZ-789',
  current_mileage: 30000
};

const testCar3: CreateCarInput = {
  make: 'Ford',
  model: 'F-150',
  year: 2021,
  license_plate: 'DEF-456',
  current_mileage: 15000
};

describe('getCars', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cars exist', async () => {
    const result = await getCars();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single car', async () => {
    // Insert test car
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    const result = await getCars();
    
    expect(result).toHaveLength(1);
    expect(result[0].make).toEqual('Toyota');
    expect(result[0].model).toEqual('Camry');
    expect(result[0].year).toEqual(2020);
    expect(result[0].license_plate).toEqual('ABC-123');
    expect(result[0].current_mileage).toEqual(25000);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple cars', async () => {
    // Insert multiple test cars
    await db.insert(carsTable)
      .values([testCar1, testCar2, testCar3])
      .execute();

    const result = await getCars();
    
    expect(result).toHaveLength(3);
    
    // Check that all cars are returned
    const makes = result.map(car => car.make).sort();
    expect(makes).toEqual(['Ford', 'Honda', 'Toyota']);
    
    const models = result.map(car => car.model).sort();
    expect(models).toEqual(['Camry', 'Civic', 'F-150']);
    
    // Verify all cars have required fields
    result.forEach(car => {
      expect(car.id).toBeDefined();
      expect(car.make).toBeDefined();
      expect(car.model).toBeDefined();
      expect(car.year).toBeDefined();
      expect(car.license_plate).toBeDefined();
      expect(car.current_mileage).toBeDefined();
      expect(car.created_at).toBeInstanceOf(Date);
      expect(car.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return cars with correct data types', async () => {
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    const result = await getCars();
    
    expect(result).toHaveLength(1);
    const car = result[0];
    
    // Verify data types
    expect(typeof car.id).toBe('number');
    expect(typeof car.make).toBe('string');
    expect(typeof car.model).toBe('string');
    expect(typeof car.year).toBe('number');
    expect(typeof car.license_plate).toBe('string');
    expect(typeof car.current_mileage).toBe('number');
    expect(car.created_at).toBeInstanceOf(Date);
    expect(car.updated_at).toBeInstanceOf(Date);
  });

  it('should maintain insertion order consistency', async () => {
    // Insert cars in specific order
    for (const car of [testCar1, testCar2, testCar3]) {
      await db.insert(carsTable)
        .values(car)
        .execute();
    }

    const result = await getCars();
    
    expect(result).toHaveLength(3);
    
    // Cars should be returned in insertion order (by id)
    expect(result[0].make).toEqual('Toyota');
    expect(result[1].make).toEqual('Honda');
    expect(result[2].make).toEqual('Ford');
    
    // IDs should be sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
