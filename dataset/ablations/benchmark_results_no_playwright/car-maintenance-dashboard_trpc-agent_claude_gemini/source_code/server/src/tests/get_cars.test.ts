import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { getCars } from '../handlers/get_cars';

// Test car inputs
const testCar1: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1HGBH41JXMN109186',
  license_plate: 'ABC123',
  current_mileage: 25000
};

const testCar2: CreateCarInput = {
  make: 'Honda',
  model: 'Accord',
  year: 2019,
  vin: null,
  license_plate: null,
  current_mileage: 30000
};

const testCar3: CreateCarInput = {
  make: 'Ford',
  model: 'F-150',
  year: 2021,
  vin: '3HGBH41JXMN109187',
  license_plate: 'XYZ789',
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

  it('should return all cars when cars exist', async () => {
    // Create test cars
    await db.insert(carsTable)
      .values([testCar1, testCar2, testCar3])
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(3);
    
    // Verify all cars are returned
    const makes = result.map(car => car.make).sort();
    expect(makes).toEqual(['Ford', 'Honda', 'Toyota']);
    
    // Verify structure of returned cars
    result.forEach(car => {
      expect(car.id).toBeDefined();
      expect(typeof car.id).toBe('number');
      expect(car.make).toBeDefined();
      expect(car.model).toBeDefined();
      expect(car.year).toBeDefined();
      expect(typeof car.year).toBe('number');
      expect(typeof car.current_mileage).toBe('number');
      expect(car.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle nullable fields correctly', async () => {
    // Create car with null values
    await db.insert(carsTable)
      .values(testCar2) // Has null vin and license_plate
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(1);
    const car = result[0];
    
    expect(car.make).toEqual('Honda');
    expect(car.model).toEqual('Accord');
    expect(car.year).toEqual(2019);
    expect(car.vin).toBeNull();
    expect(car.license_plate).toBeNull();
    expect(car.current_mileage).toEqual(30000);
  });

  it('should return cars ordered by id (database default)', async () => {
    // Insert cars in specific order
    const car1Result = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();
    
    const car2Result = await db.insert(carsTable)
      .values(testCar2)
      .returning()
      .execute();
    
    const car3Result = await db.insert(carsTable)
      .values(testCar3)
      .returning()
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(3);
    
    // Should return in order of insertion (by id)
    expect(result[0].id).toEqual(car1Result[0].id);
    expect(result[1].id).toEqual(car2Result[0].id);
    expect(result[2].id).toEqual(car3Result[0].id);
    
    expect(result[0].make).toEqual('Toyota');
    expect(result[1].make).toEqual('Honda');
    expect(result[2].make).toEqual('Ford');
  });

  it('should return cars with all expected fields', async () => {
    await db.insert(carsTable)
      .values(testCar1)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(1);
    const car = result[0];
    
    // Verify all schema fields are present
    expect(car).toHaveProperty('id');
    expect(car).toHaveProperty('make');
    expect(car).toHaveProperty('model');
    expect(car).toHaveProperty('year');
    expect(car).toHaveProperty('vin');
    expect(car).toHaveProperty('license_plate');
    expect(car).toHaveProperty('current_mileage');
    expect(car).toHaveProperty('created_at');
    
    // Verify specific values
    expect(car.make).toEqual('Toyota');
    expect(car.model).toEqual('Camry');
    expect(car.year).toEqual(2020);
    expect(car.vin).toEqual('1HGBH41JXMN109186');
    expect(car.license_plate).toEqual('ABC123');
    expect(car.current_mileage).toEqual(25000);
  });
});
