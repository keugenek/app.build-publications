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
  year: 2024,
  vin: '1HGCM82633A004352'
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car with valid input', async () => {
    const result = await createCar(testInput);

    // Verify all fields are correctly set
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2024);
    expect(result.vin).toEqual('1HGCM82633A004352');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save car to database', async () => {
    const result = await createCar(testInput);

    // Query database to verify car was saved
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, result.id))
      .execute();

    expect(cars).toHaveLength(1);
    expect(cars[0].make).toEqual('Toyota');
    expect(cars[0].model).toEqual('Camry');
    expect(cars[0].year).toEqual(2024);
    expect(cars[0].vin).toEqual('1HGCM82633A004352');
    expect(cars[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate VINs', async () => {
    // Create first car
    await createCar(testInput);

    // Attempt to create second car with same VIN
    const duplicateInput: CreateCarInput = {
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      vin: '1HGCM82633A004352' // Same VIN
    };

    await expect(createCar(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow different cars with different VINs', async () => {
    // Create first car
    const firstCar = await createCar(testInput);

    // Create second car with different VIN
    const secondInput: CreateCarInput = {
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      vin: '2HGCM82633A004353' // Different VIN
    };

    const secondCar = await createCar(secondInput);

    // Both cars should exist
    expect(firstCar.id).toBeDefined();
    expect(secondCar.id).toBeDefined();
    expect(firstCar.id).not.toEqual(secondCar.id);

    // Verify both cars are in database
    const allCars = await db.select().from(carsTable).execute();
    expect(allCars).toHaveLength(2);
  });

  it('should handle edge cases for year and VIN', async () => {
    const edgeCaseInput: CreateCarInput = {
      make: 'Ford',
      model: 'F-150',
      year: 1900, // Minimum year
      vin: 'A' // Single character VIN
    };

    const result = await createCar(edgeCaseInput);

    expect(result.year).toEqual(1900);
    expect(result.vin).toEqual('A');
    expect(result.make).toEqual('Ford');
    expect(result.model).toEqual('F-150');
  });

  it('should handle future year correctly', async () => {
    const currentYear = new Date().getFullYear();
    const futureInput: CreateCarInput = {
      make: 'Tesla',
      model: 'Model S',
      year: currentYear + 1, // Future year
      vin: 'FUTURE2025VIN001'
    };

    const result = await createCar(futureInput);

    expect(result.year).toEqual(currentYear + 1);
    expect(result.make).toEqual('Tesla');
    expect(result.model).toEqual('Model S');
  });
});
