import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type CreateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Test setup data
const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  current_mileage: 15000
};

describe('updateCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a car', async () => {
    // Create a car first
    const createdResult = await db.insert(carsTable)
      .values({
        ...testCar
      })
      .returning()
      .execute();

    const createdCar = createdResult[0];

    // Update all fields
    const updateInput: UpdateCarInput = {
      id: createdCar.id,
      make: 'Honda',
      model: 'Accord',
      year: 2022,
      license_plate: 'XYZ789',
      current_mileage: 25000
    };

    const result = await updateCar(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdCar.id);
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Accord');
    expect(result.year).toEqual(2022);
    expect(result.license_plate).toEqual('XYZ789');
    expect(result.current_mileage).toEqual(25000);
    expect(result.created_at).toEqual(createdCar.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdCar.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create a car first
    const createdResult = await db.insert(carsTable)
      .values({
        ...testCar
      })
      .returning()
      .execute();

    const createdCar = createdResult[0];

    // Update only make and mileage
    const updateInput: UpdateCarInput = {
      id: createdCar.id,
      make: 'Ford',
      current_mileage: 20000
    };

    const result = await updateCar(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(createdCar.id);
    expect(result.make).toEqual('Ford');
    expect(result.model).toEqual(createdCar.model); // Should remain unchanged
    expect(result.year).toEqual(createdCar.year); // Should remain unchanged
    expect(result.license_plate).toEqual(createdCar.license_plate); // Should remain unchanged
    expect(result.current_mileage).toEqual(20000);
    expect(result.created_at).toEqual(createdCar.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdCar.updated_at).toBe(true);
  });

  it('should update the database record correctly', async () => {
    // Create a car first
    const createdResult = await db.insert(carsTable)
      .values({
        ...testCar
      })
      .returning()
      .execute();

    const createdCar = createdResult[0];

    // Update the car
    const updateInput: UpdateCarInput = {
      id: createdCar.id,
      make: 'Nissan',
      current_mileage: 30000
    };

    await updateCar(updateInput);

    // Verify the database was updated
    const dbResult = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, createdCar.id))
      .execute();

    expect(dbResult).toHaveLength(1);
    const updatedCar = dbResult[0];

    expect(updatedCar.make).toEqual('Nissan');
    expect(updatedCar.model).toEqual(createdCar.model); // Should remain unchanged
    expect(updatedCar.current_mileage).toEqual(30000);
    expect(updatedCar.updated_at).toBeInstanceOf(Date);
    expect(updatedCar.updated_at > createdCar.updated_at).toBe(true);
  });

  it('should throw error when car does not exist', async () => {
    const updateInput: UpdateCarInput = {
      id: 99999, // Non-existent ID
      make: 'Honda'
    };

    await expect(updateCar(updateInput)).rejects.toThrow(/Car with id 99999 not found/i);
  });

  it('should handle edge cases with year boundaries', async () => {
    // Create a car first
    const createdResult = await db.insert(carsTable)
      .values({
        ...testCar
      })
      .returning()
      .execute();

    const createdCar = createdResult[0];

    // Update with current year + 1 (future model year)
    const currentYear = new Date().getFullYear();
    const updateInput: UpdateCarInput = {
      id: createdCar.id,
      year: currentYear + 1
    };

    const result = await updateCar(updateInput);

    expect(result.year).toEqual(currentYear + 1);
  });

  it('should handle zero mileage update', async () => {
    // Create a car first
    const createdResult = await db.insert(carsTable)
      .values({
        ...testCar
      })
      .returning()
      .execute();

    const createdCar = createdResult[0];

    // Update mileage to zero
    const updateInput: UpdateCarInput = {
      id: createdCar.id,
      current_mileage: 0
    };

    const result = await updateCar(updateInput);

    expect(result.current_mileage).toEqual(0);
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    // Create a car first
    const createdResult = await db.insert(carsTable)
      .values({
        ...testCar
      })
      .returning()
      .execute();

    const createdCar = createdResult[0];

    // Wait a small moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with just the ID (no field changes)
    const updateInput: UpdateCarInput = {
      id: createdCar.id
    };

    const result = await updateCar(updateInput);

    // Verify updated_at was still updated
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdCar.updated_at).toBe(true);
    
    // All other fields should remain the same
    expect(result.make).toEqual(createdCar.make);
    expect(result.model).toEqual(createdCar.model);
    expect(result.year).toEqual(createdCar.year);
    expect(result.license_plate).toEqual(createdCar.license_plate);
    expect(result.current_mileage).toEqual(createdCar.current_mileage);
  });
});
