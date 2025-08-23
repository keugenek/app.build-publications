import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { getCars } from '../handlers/get_cars';

// Test inputs
const testCar1: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1234567890',
  current_mileage: 15000
};

const testCar2: CreateCarInput = {
  make: 'Honda',
  model: 'Civic',
  year: 2019,
  vin: '0987654321',
  current_mileage: 25000
};

describe('getCars', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no cars exist', async () => {
    const result = await getCars();
    expect(result).toEqual([]);
  });

  it('should return all cars from the database', async () => {
    // Insert test cars directly into database
    await db.insert(carsTable)
      .values(testCar1)
      .execute();
      
    await db.insert(carsTable)
      .values(testCar2)
      .execute();

    const result = await getCars();

    expect(result).toHaveLength(2);
    
    // Check first car
    const car1 = result.find(car => car.make === 'Toyota');
    expect(car1).toBeDefined();
    expect(car1?.model).toEqual('Camry');
    expect(car1?.year).toEqual(2020);
    expect(car1?.vin).toEqual('1234567890');
    expect(car1?.current_mileage).toEqual(15000);
    expect(car1?.id).toBeDefined();
    expect(car1?.created_at).toBeInstanceOf(Date);
    expect(car1?.updated_at).toBeInstanceOf(Date);

    // Check second car
    const car2 = result.find(car => car.make === 'Honda');
    expect(car2).toBeDefined();
    expect(car2?.model).toEqual('Civic');
    expect(car2?.year).toEqual(2019);
    expect(car2?.vin).toEqual('0987654321');
    expect(car2?.current_mileage).toEqual(25000);
    expect(car2?.id).toBeDefined();
    expect(car2?.created_at).toBeInstanceOf(Date);
    expect(car2?.updated_at).toBeInstanceOf(Date);
  });
});
