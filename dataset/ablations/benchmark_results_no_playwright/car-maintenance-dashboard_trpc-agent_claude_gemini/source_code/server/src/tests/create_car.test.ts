import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { createCar } from '../handlers/create_car';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  vin: 'JT2BF28K0X0000001',
  license_plate: 'ABC123',
  current_mileage: 15000
};

// Test input with nullable fields set to null
const testInputWithNulls: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  vin: null,
  license_plate: null,
  current_mileage: 25000
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car with all fields', async () => {
    const result = await createCar(testInput);

    // Basic field validation
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2022);
    expect(result.vin).toEqual('JT2BF28K0X0000001');
    expect(result.license_plate).toEqual('ABC123');
    expect(result.current_mileage).toEqual(15000);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a car with nullable fields as null', async () => {
    const result = await createCar(testInputWithNulls);

    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Civic');
    expect(result.year).toEqual(2021);
    expect(result.vin).toBeNull();
    expect(result.license_plate).toBeNull();
    expect(result.current_mileage).toEqual(25000);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save car to database', async () => {
    const result = await createCar(testInput);

    // Query using proper drizzle syntax
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, result.id))
      .execute();

    expect(cars).toHaveLength(1);
    expect(cars[0].make).toEqual('Toyota');
    expect(cars[0].model).toEqual('Camry');
    expect(cars[0].year).toEqual(2022);
    expect(cars[0].vin).toEqual('JT2BF28K0X0000001');
    expect(cars[0].license_plate).toEqual('ABC123');
    expect(cars[0].current_mileage).toEqual(15000);
    expect(cars[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple cars with unique IDs', async () => {
    const result1 = await createCar(testInput);
    const result2 = await createCar(testInputWithNulls);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.make).toEqual('Toyota');
    expect(result2.make).toEqual('Honda');

    // Verify both cars exist in database
    const allCars = await db.select()
      .from(carsTable)
      .execute();

    expect(allCars).toHaveLength(2);
  });

  it('should handle minimum valid year', async () => {
    const minYearInput: CreateCarInput = {
      make: 'Ford',
      model: 'Model T',
      year: 1908,
      vin: null,
      license_plate: null,
      current_mileage: 100000
    };

    const result = await createCar(minYearInput);

    expect(result.year).toEqual(1908);
    expect(result.make).toEqual('Ford');
    expect(result.model).toEqual('Model T');
  });

  it('should handle zero mileage', async () => {
    const zeroMileageInput: CreateCarInput = {
      make: 'BMW',
      model: 'X5',
      year: 2023,
      vin: 'WBAFR1C50DD000001',
      license_plate: 'NEW2023',
      current_mileage: 0
    };

    const result = await createCar(zeroMileageInput);

    expect(result.current_mileage).toEqual(0);
    expect(result.make).toEqual('BMW');
    expect(result.model).toEqual('X5');
  });

  it('should set created_at to current timestamp', async () => {
    const beforeCreation = new Date();
    const result = await createCar(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
