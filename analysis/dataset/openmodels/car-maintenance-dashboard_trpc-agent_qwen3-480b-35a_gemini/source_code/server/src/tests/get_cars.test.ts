import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car } from '../schema';
import { getCars } from '../handlers/get_cars';

// Test data
const testCars = [
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    license_plate: 'ABC123',
    vin: '1HGBH41JXMN109186'
  },
  {
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    license_plate: 'XYZ789',
    vin: '2HGFC2F59KH123456'
  }
];

describe('getCars', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test cars
    for (const car of testCars) {
      await db.insert(carsTable).values(car).execute();
    }
  });
  
  afterEach(resetDB);

  it('should return an empty array when no cars exist', async () => {
    // Clear the database first
    await resetDB();
    await createDB();
    
    const result = await getCars();
    expect(result).toEqual([]);
  });

  it('should fetch all cars from the database', async () => {
    const result = await getCars();
    
    expect(result).toHaveLength(2);
    
    // Check that all expected cars are returned
    const toyota = result.find(car => car.make === 'Toyota');
    const honda = result.find(car => car.make === 'Honda');
    
    expect(toyota).toBeDefined();
    expect(honda).toBeDefined();
    
    // Verify Toyota details
    expect(toyota!.model).toBe('Camry');
    expect(toyota!.year).toBe(2020);
    expect(toyota!.license_plate).toBe('ABC123');
    expect(toyota!.vin).toBe('1HGBH41JXMN109186');
    expect(toyota!.id).toBeDefined();
    expect(toyota!.created_at).toBeInstanceOf(Date);
    
    // Verify Honda details
    expect(honda!.model).toBe('Civic');
    expect(honda!.year).toBe(2019);
    expect(honda!.license_plate).toBe('XYZ789');
    expect(honda!.vin).toBe('2HGFC2F59KH123456');
    expect(honda!.id).toBeDefined();
    expect(honda!.created_at).toBeInstanceOf(Date);
  });

  it('should return cars with proper types', async () => {
    const result = await getCars();
    
    expect(result).toBeInstanceOf(Array);
    
    if (result.length > 0) {
      const car = result[0];
      expect(typeof car.id).toBe('number');
      expect(typeof car.make).toBe('string');
      expect(typeof car.model).toBe('string');
      expect(typeof car.year).toBe('number');
      expect(typeof car.license_plate).toBe('string');
      expect(typeof car.vin).toBe('string');
      expect(car.created_at).toBeInstanceOf(Date);
    }
  });
});
