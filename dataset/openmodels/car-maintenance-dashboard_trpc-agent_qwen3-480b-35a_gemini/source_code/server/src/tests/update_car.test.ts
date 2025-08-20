import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput, type UpdateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Test input for creating a car
const createCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  vin: '12345678901234567'
};

// Test input for updating a car
const updateCarInput: UpdateCarInput = {
  id: 1,
  make: 'Honda',
  model: 'Civic'
};

describe('updateCar', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test car first
    await db.insert(carsTable)
      .values(createCarInput)
      .execute();
  });
  
  afterEach(resetDB);

  it('should update an existing car', async () => {
    const result = await updateCar(updateCarInput);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    
    if (result) {
      expect(result.id).toEqual(1);
      expect(result.make).toEqual('Honda');
      expect(result.model).toEqual('Civic');
      expect(result.year).toEqual(2020); // Should remain unchanged
      expect(result.license_plate).toEqual('ABC123'); // Should remain unchanged
      expect(result.vin).toEqual('12345678901234567'); // Should remain unchanged
      expect(result.created_at).toBeInstanceOf(Date);
    }
  });

  it('should partially update a car with only some fields', async () => {
    const partialUpdate: UpdateCarInput = {
      id: 1,
      year: 2021
    };

    const result = await updateCar(partialUpdate);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    
    if (result) {
      expect(result.id).toEqual(1);
      expect(result.make).toEqual('Toyota'); // Should remain unchanged
      expect(result.model).toEqual('Camry'); // Should remain unchanged
      expect(result.year).toEqual(2021); // Should be updated
      expect(result.license_plate).toEqual('ABC123'); // Should remain unchanged
      expect(result.vin).toEqual('12345678901234567'); // Should remain unchanged
    }
  });

  it('should return null when updating a non-existent car', async () => {
    const nonExistentUpdate: UpdateCarInput = {
      id: 999,
      make: 'NonExistent'
    };

    const result = await updateCar(nonExistentUpdate);
    expect(result).toBeNull();
  });

  it('should save updated car to database', async () => {
    await updateCar(updateCarInput);

    // Query using proper drizzle syntax
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, 1))
      .execute();

    expect(cars).toHaveLength(1);
    expect(cars[0].make).toEqual('Honda');
    expect(cars[0].model).toEqual('Civic');
    expect(cars[0].year).toEqual(2020);
  });
});
