import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { createCar } from '../handlers/create_car';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  license_plate: 'ABC123',
  vin: '1HGBH41JXMN109186'
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car', async () => {
    const result = await createCar(testInput);

    // Basic field validation
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2022);
    expect(result.license_plate).toEqual('ABC123');
    expect(result.vin).toEqual('1HGBH41JXMN109186');
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
    expect(cars[0].year).toEqual(2022);
    expect(cars[0].license_plate).toEqual('ABC123');
    expect(cars[0].vin).toEqual('1HGBH41JXMN109186');
    expect(cars[0].created_at).toBeInstanceOf(Date);
  });
});
