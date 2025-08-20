import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type GetCarByIdInput } from '../schema';
import { getCarById } from '../handlers/get_car_by_id';

describe('getCarById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a car when it exists', async () => {
    // Create a test car first
    const testCar = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186'
      })
      .returning()
      .execute();

    const carId = testCar[0].id;

    // Test input
    const input: GetCarByIdInput = {
      id: carId
    };

    const result = await getCarById(input);

    // Verify the car was returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(carId);
    expect(result!.make).toEqual('Toyota');
    expect(result!.model).toEqual('Camry');
    expect(result!.year).toEqual(2020);
    expect(result!.vin).toEqual('1HGBH41JXMN109186');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when car does not exist', async () => {
    // Test with a non-existent ID
    const input: GetCarByIdInput = {
      id: 99999
    };

    const result = await getCarById(input);

    // Should return null for non-existent car
    expect(result).toBeNull();
  });

  it('should return the correct car when multiple cars exist', async () => {
    // Create multiple test cars
    const cars = await db.insert(carsTable)
      .values([
        {
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          vin: '2HGFC2F59JH123456'
        },
        {
          make: 'Ford',
          model: 'F-150',
          year: 2021,
          vin: '1FTFW1ET5DFC12345'
        },
        {
          make: 'BMW',
          model: 'X5',
          year: 2022,
          vin: '5UXCR6C04N9D12345'
        }
      ])
      .returning()
      .execute();

    // Get the second car specifically
    const targetCarId = cars[1].id;
    const input: GetCarByIdInput = {
      id: targetCarId
    };

    const result = await getCarById(input);

    // Should return the specific car we requested
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetCarId);
    expect(result!.make).toEqual('Ford');
    expect(result!.model).toEqual('F-150');
    expect(result!.year).toEqual(2021);
    expect(result!.vin).toEqual('1FTFW1ET5DFC12345');
  });

  it('should handle edge case with ID 0', async () => {
    // Test with ID 0 (which won't exist since serial starts at 1)
    const input: GetCarByIdInput = {
      id: 0
    };

    const result = await getCarById(input);

    // Should return null
    expect(result).toBeNull();
  });

  it('should handle negative ID values', async () => {
    // Test with negative ID
    const input: GetCarByIdInput = {
      id: -1
    };

    const result = await getCarById(input);

    // Should return null
    expect(result).toBeNull();
  });
});
