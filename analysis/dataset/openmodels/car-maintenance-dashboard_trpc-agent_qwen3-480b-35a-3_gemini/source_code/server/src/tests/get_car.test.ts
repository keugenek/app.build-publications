import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { getCar } from '../handlers/get_car';
import { eq } from 'drizzle-orm';

describe('getCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent car', async () => {
    const result = await getCar(999);
    expect(result).toBeNull();
  });

  it('should fetch an existing car by ID', async () => {
    // First create a car in the database
    const createdCar = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1234567890ABCDEFG',
        current_mileage: 15000
      })
      .returning()
      .execute();
    
    const carId = createdCar[0].id;
    
    // Now fetch the car using our handler
    const result = await getCar(carId);
    
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(carId);
    expect(result!.make).toEqual('Toyota');
    expect(result!.model).toEqual('Camry');
    expect(result!.year).toEqual(2020);
    expect(result!.vin).toEqual('1234567890ABCDEFG');
    expect(result!.current_mileage).toEqual(15000);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle cars with zero mileage', async () => {
    // Create a car with zero mileage
    const createdCar = await db.insert(carsTable)
      .values({
        make: 'New Car',
        model: 'Model X',
        year: 2023,
        vin: 'NEWCAR00000000000',
        current_mileage: 0
      })
      .returning()
      .execute();
    
    const carId = createdCar[0].id;
    
    const result = await getCar(carId);
    
    expect(result).not.toBeNull();
    expect(result!.current_mileage).toEqual(0);
  });

  it('should handle cars with special characters in fields', async () => {
    // Create a car with special characters
    const createdCar = await db.insert(carsTable)
      .values({
        make: 'Renault',
        model: 'Clio Grand Prix \'23',
        year: 2023,
        vin: 'VIN-WITH-SPECIAL-CHARS-001',
        current_mileage: 5000
      })
      .returning()
      .execute();
    
    const carId = createdCar[0].id;
    
    const result = await getCar(carId);
    
    expect(result).not.toBeNull();
    expect(result!.model).toEqual('Clio Grand Prix \'23');
    expect(result!.vin).toEqual('VIN-WITH-SPECIAL-CHARS-001');
  });
});
