import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { createCar } from '../handlers/create_car';
import { eq } from 'drizzle-orm';

// Test input with valid car data
const testInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  license_plate: 'ABC123'
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car', async () => {
    const result = await createCar(testInput);

    // Basic field validation
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2023);
    expect(result.license_plate).toEqual('ABC123');
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
    expect(cars[0].year).toEqual(2023);
    expect(cars[0].license_plate).toEqual('ABC123');
    expect(cars[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple cars with different data', async () => {
    const car1Input: CreateCarInput = {
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      license_plate: 'XYZ789'
    };

    const car2Input: CreateCarInput = {
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      license_plate: 'DEF456'
    };

    const result1 = await createCar(car1Input);
    const result2 = await createCar(car2Input);

    // Verify both cars were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.make).toEqual('Honda');
    expect(result1.model).toEqual('Civic');
    expect(result2.make).toEqual('Ford');
    expect(result2.model).toEqual('F-150');

    // Verify both cars exist in database
    const allCars = await db.select()
      .from(carsTable)
      .execute();

    expect(allCars).toHaveLength(2);
    const makes = allCars.map(car => car.make);
    expect(makes).toContain('Honda');
    expect(makes).toContain('Ford');
  });

  it('should handle edge case years correctly', async () => {
    const oldCarInput: CreateCarInput = {
      make: 'Ford',
      model: 'Model T',
      year: 1908,
      license_plate: 'CLASSIC'
    };

    const futureCarInput: CreateCarInput = {
      make: 'Tesla',
      model: 'Cybertruck',
      year: new Date().getFullYear() + 1,
      license_plate: 'FUTURE1'
    };

    const oldCar = await createCar(oldCarInput);
    const futureCar = await createCar(futureCarInput);

    expect(oldCar.year).toEqual(1908);
    expect(futureCar.year).toEqual(new Date().getFullYear() + 1);

    // Verify in database
    const cars = await db.select()
      .from(carsTable)
      .execute();

    expect(cars).toHaveLength(2);
    const years = cars.map(car => car.year);
    expect(years).toContain(1908);
    expect(years).toContain(new Date().getFullYear() + 1);
  });
});
