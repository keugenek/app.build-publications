import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type GetCarByIdInput, type CreateCarInput } from '../schema';
import { getCarById } from '../handlers/get_car_by_id';

// Test car data
const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  license_plate: 'ABC123',
  current_mileage: 15000
};

const anotherTestCar: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  license_plate: 'XYZ789',
  current_mileage: 25000
};

describe('getCarById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return car when found', async () => {
    // Create a test car
    const insertResult = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const createdCar = insertResult[0];
    const input: GetCarByIdInput = { id: createdCar.id };

    // Test the handler
    const result = await getCarById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCar.id);
    expect(result!.make).toEqual('Toyota');
    expect(result!.model).toEqual('Camry');
    expect(result!.year).toEqual(2022);
    expect(result!.license_plate).toEqual('ABC123');
    expect(result!.current_mileage).toEqual(15000);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when car not found', async () => {
    const input: GetCarByIdInput = { id: 999 }; // Non-existent ID

    const result = await getCarById(input);

    expect(result).toBeNull();
  });

  it('should return correct car when multiple cars exist', async () => {
    // Create multiple test cars
    const insertResult1 = await db.insert(carsTable)
      .values({
        make: testCar.make,
        model: testCar.model,
        year: testCar.year,
        license_plate: testCar.license_plate,
        current_mileage: testCar.current_mileage
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(carsTable)
      .values({
        make: anotherTestCar.make,
        model: anotherTestCar.model,
        year: anotherTestCar.year,
        license_plate: anotherTestCar.license_plate,
        current_mileage: anotherTestCar.current_mileage
      })
      .returning()
      .execute();

    const firstCarId = insertResult1[0].id;
    const secondCarId = insertResult2[0].id;

    // Test fetching the first car
    const input1: GetCarByIdInput = { id: firstCarId };
    const result1 = await getCarById(input1);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(firstCarId);
    expect(result1!.make).toEqual('Toyota');
    expect(result1!.model).toEqual('Camry');
    expect(result1!.license_plate).toEqual('ABC123');

    // Test fetching the second car
    const input2: GetCarByIdInput = { id: secondCarId };
    const result2 = await getCarById(input2);

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(secondCarId);
    expect(result2!.make).toEqual('Honda');
    expect(result2!.model).toEqual('Civic');
    expect(result2!.license_plate).toEqual('XYZ789');
  });

  it('should handle edge case with ID 0', async () => {
    const input: GetCarByIdInput = { id: 0 }; // Edge case: ID 0

    const result = await getCarById(input);

    expect(result).toBeNull();
  });

  it('should handle negative ID', async () => {
    const input: GetCarByIdInput = { id: -1 }; // Edge case: negative ID

    const result = await getCarById(input);

    expect(result).toBeNull();
  });

  it('should preserve all data types correctly', async () => {
    // Create car with specific values to test type preservation
    const insertResult = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X5',
        year: 2023,
        license_plate: 'BMW2023',
        current_mileage: 0 // Test with zero mileage
      })
      .returning()
      .execute();

    const createdCar = insertResult[0];
    const input: GetCarByIdInput = { id: createdCar.id };

    const result = await getCarById(input);

    expect(result).not.toBeNull();
    
    // Verify data types
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.make).toBe('string');
    expect(typeof result!.model).toBe('string');
    expect(typeof result!.year).toBe('number');
    expect(typeof result!.license_plate).toBe('string');
    expect(typeof result!.current_mileage).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(result!.year).toEqual(2023);
    expect(result!.current_mileage).toEqual(0);
  });
});
