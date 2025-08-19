import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type CreateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Helper function to create a test car
const createTestCar = async (): Promise<number> => {
  const testCarInput: CreateCarInput = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    license_plate: 'ABC-123'
  };

  const result = await db.insert(carsTable)
    .values(testCarInput)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all car fields', async () => {
    const carId = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: carId,
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      license_plate: 'XYZ-789'
    };

    const result = await updateCar(updateInput);

    expect(result.id).toEqual(carId);
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Civic');
    expect(result.year).toEqual(2022);
    expect(result.license_plate).toEqual('XYZ-789');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const carId = await createTestCar();

    // Update only make and year
    const updateInput: UpdateCarInput = {
      id: carId,
      make: 'Ford',
      year: 2023
    };

    const result = await updateCar(updateInput);

    expect(result.id).toEqual(carId);
    expect(result.make).toEqual('Ford');
    expect(result.model).toEqual('Camry'); // Should remain unchanged
    expect(result.year).toEqual(2023);
    expect(result.license_plate).toEqual('ABC-123'); // Should remain unchanged
  });

  it('should update single field', async () => {
    const carId = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: carId,
      license_plate: 'NEW-PLATE'
    };

    const result = await updateCar(updateInput);

    expect(result.id).toEqual(carId);
    expect(result.make).toEqual('Toyota'); // Should remain unchanged
    expect(result.model).toEqual('Camry'); // Should remain unchanged
    expect(result.year).toEqual(2020); // Should remain unchanged
    expect(result.license_plate).toEqual('NEW-PLATE');
  });

  it('should persist changes in database', async () => {
    const carId = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: carId,
      make: 'BMW',
      model: '3 Series'
    };

    await updateCar(updateInput);

    // Query database to verify changes were persisted
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    expect(cars).toHaveLength(1);
    expect(cars[0].make).toEqual('BMW');
    expect(cars[0].model).toEqual('3 Series');
    expect(cars[0].year).toEqual(2020); // Should remain unchanged
    expect(cars[0].license_plate).toEqual('ABC-123'); // Should remain unchanged
  });

  it('should throw error when car does not exist', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateCarInput = {
      id: nonExistentId,
      make: 'Toyota'
    };

    await expect(updateCar(updateInput)).rejects.toThrow(/Car with id 99999 not found/i);
  });

  it('should handle edge case values correctly', async () => {
    const carId = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: carId,
      make: 'A', // Single character
      model: 'Very Long Model Name With Spaces And Numbers 123',
      year: 1900, // Minimum allowed year
      license_plate: '1'
    };

    const result = await updateCar(updateInput);

    expect(result.make).toEqual('A');
    expect(result.model).toEqual('Very Long Model Name With Spaces And Numbers 123');
    expect(result.year).toEqual(1900);
    expect(result.license_plate).toEqual('1');
  });

  it('should preserve created_at timestamp', async () => {
    const carId = await createTestCar();

    // Get original created_at
    const originalCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    const originalCreatedAt = originalCar[0].created_at;

    // Update the car
    const updateInput: UpdateCarInput = {
      id: carId,
      make: 'Updated Make'
    };

    const result = await updateCar(updateInput);

    // Verify created_at is preserved
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
