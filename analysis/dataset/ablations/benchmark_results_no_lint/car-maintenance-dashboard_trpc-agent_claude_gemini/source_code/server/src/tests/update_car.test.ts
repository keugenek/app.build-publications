import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Test car data
const testCar1 = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  vin: '1HGBH41JXMN109186'
};

const testCar2 = {
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  vin: '2HGFC2F59NH123456'
};

describe('updateCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a car with all fields', async () => {
    // Create initial car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Honda',
      model: 'Accord',
      year: 2023,
      vin: '3HGCM82633G123456'
    };

    const result = await updateCar(updateInput);

    expect(result.id).toEqual(car.id);
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Accord');
    expect(result.year).toEqual(2023);
    expect(result.vin).toEqual('3HGCM82633G123456');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Honda',
      year: 2023
    };

    const result = await updateCar(updateInput);

    expect(result.id).toEqual(car.id);
    expect(result.make).toEqual('Honda'); // Updated
    expect(result.model).toEqual('Camry'); // Unchanged
    expect(result.year).toEqual(2023); // Updated
    expect(result.vin).toEqual('1HGBH41JXMN109186'); // Unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update and save changes to database', async () => {
    // Create initial car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Honda',
      model: 'Accord'
    };

    await updateCar(updateInput);

    // Verify changes were saved
    const updatedCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(updatedCars).toHaveLength(1);
    expect(updatedCars[0].make).toEqual('Honda');
    expect(updatedCars[0].model).toEqual('Accord');
    expect(updatedCars[0].year).toEqual(2022); // Unchanged
    expect(updatedCars[0].vin).toEqual('1HGBH41JXMN109186'); // Unchanged
  });

  it('should throw error when car does not exist', async () => {
    const updateInput: UpdateCarInput = {
      id: 99999,
      make: 'Honda'
    };

    await expect(updateCar(updateInput)).rejects.toThrow(/car with id 99999 not found/i);
  });

  it('should throw error when VIN already exists for another car', async () => {
    // Create two cars
    const [car1] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    const [car2] = await db.insert(carsTable)
      .values(testCar2)
      .returning()
      .execute();

    // Try to update car2 with car1's VIN
    const updateInput: UpdateCarInput = {
      id: car2.id,
      vin: testCar1.vin
    };

    await expect(updateCar(updateInput)).rejects.toThrow(/vin .+ already exists for another car/i);
  });

  it('should allow updating VIN to same value (no change)', async () => {
    // Create car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    // Update with same VIN (should not conflict)
    const updateInput: UpdateCarInput = {
      id: car.id,
      vin: testCar1.vin,
      make: 'Honda'
    };

    const result = await updateCar(updateInput);

    expect(result.vin).toEqual(testCar1.vin);
    expect(result.make).toEqual('Honda');
  });

  it('should update VIN to new unique value', async () => {
    // Create car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    const newVin = '4HGCM82633G789012';
    const updateInput: UpdateCarInput = {
      id: car.id,
      vin: newVin
    };

    const result = await updateCar(updateInput);

    expect(result.vin).toEqual(newVin);
    expect(result.make).toEqual(testCar1.make); // Unchanged
  });

  it('should handle single field updates correctly', async () => {
    // Create car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    // Test updating only year
    const updateInput: UpdateCarInput = {
      id: car.id,
      year: 2024
    };

    const result = await updateCar(updateInput);

    expect(result.year).toEqual(2024);
    expect(result.make).toEqual(testCar1.make);
    expect(result.model).toEqual(testCar1.model);
    expect(result.vin).toEqual(testCar1.vin);
  });

  it('should preserve created_at timestamp', async () => {
    // Create car
    const [car] = await db.insert(carsTable)
      .values(testCar1)
      .returning()
      .execute();

    const originalCreatedAt = car.created_at;

    // Update car
    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Updated Make'
    };

    const result = await updateCar(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});
