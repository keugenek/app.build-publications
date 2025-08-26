import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type CreateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Helper function to create a test car
const createTestCar = async (carData: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: 'TEST123456789',
  license_plate: 'ABC123',
  current_mileage: 50000
}) => {
  const result = await db.insert(carsTable)
    .values(carData)
    .returning()
    .execute();
  return result[0];
};

describe('updateCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a car', async () => {
    // Create test car
    const testCar = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: testCar.id,
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      vin: 'UPDATED123456789',
      license_plate: 'XYZ789',
      current_mileage: 75000
    };

    const result = await updateCar(updateInput);

    // Verify returned data
    expect(result.id).toEqual(testCar.id);
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Civic');
    expect(result.year).toEqual(2023);
    expect(result.vin).toEqual('UPDATED123456789');
    expect(result.license_plate).toEqual('XYZ789');
    expect(result.current_mileage).toEqual(75000);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(testCar.created_at);
  });

  it('should update only provided fields', async () => {
    // Create test car
    const testCar = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: testCar.id,
      make: 'Nissan',
      current_mileage: 60000
    };

    const result = await updateCar(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(testCar.id);
    expect(result.make).toEqual('Nissan'); // Updated
    expect(result.model).toEqual('Camry'); // Not updated
    expect(result.year).toEqual(2020); // Not updated
    expect(result.vin).toEqual('TEST123456789'); // Not updated
    expect(result.license_plate).toEqual('ABC123'); // Not updated
    expect(result.current_mileage).toEqual(60000); // Updated
  });

  it('should update nullable fields to null', async () => {
    // Create test car with non-null values
    const testCar = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: testCar.id,
      vin: null,
      license_plate: null
    };

    const result = await updateCar(updateInput);

    // Verify nullable fields were set to null
    expect(result.vin).toBeNull();
    expect(result.license_plate).toBeNull();
    expect(result.make).toEqual('Toyota'); // Other fields unchanged
    expect(result.model).toEqual('Camry');
  });

  it('should save updates to database', async () => {
    // Create test car
    const testCar = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: testCar.id,
      make: 'Ford',
      model: 'F-150',
      current_mileage: 100000
    };

    await updateCar(updateInput);

    // Query database directly to verify persistence
    const updatedCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, testCar.id))
      .execute();

    expect(updatedCars).toHaveLength(1);
    expect(updatedCars[0].make).toEqual('Ford');
    expect(updatedCars[0].model).toEqual('F-150');
    expect(updatedCars[0].current_mileage).toEqual(100000);
    expect(updatedCars[0].year).toEqual(2020); // Unchanged field
  });

  it('should throw error when car does not exist', async () => {
    const updateInput: UpdateCarInput = {
      id: 999999, // Non-existent ID
      make: 'Tesla'
    };

    await expect(updateCar(updateInput)).rejects.toThrow(/Car with id 999999 not found/i);
  });

  it('should handle updating with same values', async () => {
    // Create test car
    const testCar = await createTestCar();

    const updateInput: UpdateCarInput = {
      id: testCar.id,
      make: 'Toyota', // Same as existing
      model: 'Camry', // Same as existing
      current_mileage: 50000 // Same as existing
    };

    const result = await updateCar(updateInput);

    // Should succeed and return same values
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.current_mileage).toEqual(50000);
    expect(result.created_at).toEqual(testCar.created_at);
  });

  it('should update car with minimal data', async () => {
    // Create car with minimal required fields
    const testCar = await createTestCar({
      make: 'Basic',
      model: 'Car',
      year: 2010,
      vin: null,
      license_plate: null,
      current_mileage: 0
    });

    const updateInput: UpdateCarInput = {
      id: testCar.id,
      vin: 'NEWVIN123456789',
      license_plate: 'NEW123',
      current_mileage: 25000
    };

    const result = await updateCar(updateInput);

    expect(result.vin).toEqual('NEWVIN123456789');
    expect(result.license_plate).toEqual('NEW123');
    expect(result.current_mileage).toEqual(25000);
    expect(result.make).toEqual('Basic'); // Unchanged
    expect(result.model).toEqual('Car'); // Unchanged
  });

  it('should handle boundary values correctly', async () => {
    // Create test car
    const testCar = await createTestCar();

    const currentYear = new Date().getFullYear();
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      year: currentYear + 1, // Maximum allowed year
      current_mileage: 0 // Minimum allowed mileage
    };

    const result = await updateCar(updateInput);

    expect(result.year).toEqual(currentYear + 1);
    expect(result.current_mileage).toEqual(0);
  });
});
