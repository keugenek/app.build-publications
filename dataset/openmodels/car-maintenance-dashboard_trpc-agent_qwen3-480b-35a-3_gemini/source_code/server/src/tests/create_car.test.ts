import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { createCar } from '../handlers/create_car';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1HGBH41JXMN109186',
  current_mileage: 15000
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car', async () => {
    const result = await createCar(testInput);

    // Basic field validation
    expect(result.make).toEqual('Toyota');
    expect(result.model).toEqual(testInput.model);
    expect(result.year).toEqual(2020);
    expect(result.vin).toEqual('1HGBH41JXMN109186');
    expect(result.current_mileage).toEqual(15000);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
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
    expect(cars[0].model).toEqual(testInput.model);
    expect(cars[0].year).toEqual(2020);
    expect(cars[0].vin).toEqual('1HGBH41JXMN109186');
    expect(cars[0].current_mileage).toEqual(15000);
    expect(cars[0].created_at).toBeInstanceOf(Date);
    expect(cars[0].updated_at).toBeInstanceOf(Date);
  });
});
