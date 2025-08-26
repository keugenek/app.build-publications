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
  year: 2023,
  license_plate: 'ABC123',
  current_mileage: 15000
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car with all required fields', async () => {
    const result = await createCar(testInput);

    // Validate all fields are correctly set
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2023);
    expect(result.license_plate).toEqual('ABC123');
    expect(result.current_mileage).toEqual(15000);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save car to database correctly', async () => {
    const result = await createCar(testInput);

    // Query the database to verify the car was saved
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, result.id))
      .execute();

    expect(cars).toHaveLength(1);
    const savedCar = cars[0];
    expect(savedCar.make).toEqual('Toyota');
    expect(savedCar.model).toEqual('Camry');
    expect(savedCar.year).toEqual(2023);
    expect(savedCar.license_plate).toEqual('ABC123');
    expect(savedCar.current_mileage).toEqual(15000);
    expect(savedCar.created_at).toBeInstanceOf(Date);
    expect(savedCar.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different car makes and models', async () => {
    const testInputHonda: CreateCarInput = {
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      license_plate: 'XYZ789',
      current_mileage: 8500
    };

    const result = await createCar(testInputHonda);

    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Civic');
    expect(result.year).toEqual(2022);
    expect(result.license_plate).toEqual('XYZ789');
    expect(result.current_mileage).toEqual(8500);
  });

  it('should handle zero mileage for new cars', async () => {
    const newCarInput: CreateCarInput = {
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      license_plate: 'NEW001',
      current_mileage: 0
    };

    const result = await createCar(newCarInput);

    expect(result.current_mileage).toEqual(0);
    expect(result.make).toEqual('Ford');
    expect(result.model).toEqual('F-150');
  });

  it('should handle high mileage vehicles', async () => {
    const highMileageInput: CreateCarInput = {
      make: 'Chevrolet',
      model: 'Silverado',
      year: 2015,
      license_plate: 'OLD999',
      current_mileage: 250000
    };

    const result = await createCar(highMileageInput);

    expect(result.current_mileage).toEqual(250000);
    expect(result.year).toEqual(2015);
  });

  it('should create multiple cars independently', async () => {
    const input1: CreateCarInput = {
      make: 'BMW',
      model: 'X5',
      year: 2023,
      license_plate: 'BMW001',
      current_mileage: 5000
    };

    const input2: CreateCarInput = {
      make: 'Audi',
      model: 'A4',
      year: 2022,
      license_plate: 'AUD002',
      current_mileage: 12000
    };

    const car1 = await createCar(input1);
    const car2 = await createCar(input2);

    // Verify both cars were created with unique IDs
    expect(car1.id).not.toEqual(car2.id);
    expect(car1.make).toEqual('BMW');
    expect(car2.make).toEqual('Audi');

    // Verify both cars exist in database
    const allCars = await db.select().from(carsTable).execute();
    expect(allCars).toHaveLength(2);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createCar(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
    expect(result.updated_at >= beforeCreation).toBe(true);
    expect(result.updated_at <= afterCreation).toBe(true);
  });
});
