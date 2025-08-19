import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { getCars } from '../handlers/get_cars';

// Test data
const testCar1: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123'
};

const testCar2: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2019,
  license_plate: 'XYZ789'
};

const testCar3: CreateCarInput = {
  make: 'Ford',
  model: 'F-150',
  year: 2021,
  license_plate: 'DEF456'
};

describe('getCars', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cars exist', async () => {
    const result = await getCars();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return a single car when one exists', async () => {
    // Create a test car
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(1);
    expect(result[0].make).toEqual('Toyota');
    expect(result[0].model).toEqual('Camry');
    expect(result[0].year).toEqual(2020);
    expect(result[0].license_plate).toEqual('ABC123');
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
    
    // Verify all cars are returned
    const makes = result.map(car => car.make);
    expect(makes).toContain('Toyota');
    expect(makes).toContain('Honda');
    expect(makes).toContain('Ford');
    
    // Verify each car has required fields
    result.forEach(car => {
      expect(car.id).toBeDefined();
      expect(typeof car.id).toBe('number');
      expect(car.make).toBeDefined();
      expect(typeof car.make).toBe('string');
      expect(car.model).toBeDefined();
      expect(typeof car.model).toBe('string');
      expect(car.year).toBeDefined();
      expect(typeof car.year).toBe('number');
      expect(car.license_plate).toBeDefined();
      expect(typeof car.license_plate).toBe('string');
      expect(car.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return cars in creation order', async () => {
    // Insert cars one by one to ensure ordering
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    await db.insert(carsTable)
      .values(testCar2)
      .execute();

    await db.insert(carsTable)
      .values(testCar3)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(3);
    // Cars should be ordered by id (which corresponds to creation order)
    expect(result[0].make).toEqual('Toyota');
    expect(result[1].make).toEqual('Honda');
    expect(result[2].make).toEqual('Ford');
    
    // Verify IDs are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });

  it('should handle various car data correctly', async () => {
    // Test edge cases with valid data
    const edgeCaseCar: CreateCarInput = {
      make: 'Mercedes-Benz',
      model: 'E-Class AMG',
      year: 2023,
      license_plate: 'MB-2023'
    };

    await db.insert(carsTable)
      .values(edgeCaseCar)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(1);
    expect(result[0].make).toEqual('Mercedes-Benz');
    expect(result[0].model).toEqual('E-Class AMG');
    expect(result[0].year).toEqual(2023);
    expect(result[0].license_plate).toEqual('MB-2023');
  });
});
