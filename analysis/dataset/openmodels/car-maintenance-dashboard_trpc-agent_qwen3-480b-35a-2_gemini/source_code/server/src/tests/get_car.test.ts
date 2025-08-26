import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { getCar } from '../handlers/get_car';
import { eq } from 'drizzle-orm';

// Test car data
const testCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  vin: '1HGBH41JXMN109186',
  nextServiceDate: new Date('2024-12-01'),
  nextServiceMileage: 50000
};

describe('getCar', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert a test car for querying
    await db.insert(carsTable).values({
      make: testCarInput.make,
      model: testCarInput.model,
      year: testCarInput.year,
      licensePlate: testCarInput.licensePlate,
      vin: testCarInput.vin,
      nextServiceDate: testCarInput.nextServiceDate ? testCarInput.nextServiceDate.toISOString().split('T')[0] : null,
      nextServiceMileage: testCarInput.nextServiceMileage
    }).execute();
  });
  
  afterEach(resetDB);

  it('should fetch an existing car by ID', async () => {
    // First, let's get the car ID from the database
    const cars = await db.select().from(carsTable).execute();
    const carId = cars[0].id;
    
    const result = await getCar(carId);
    
    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: carId,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      licensePlate: 'ABC123',
      vin: '1HGBH41JXMN109186',
      nextServiceDate: new Date('2024-12-01'),
      nextServiceMileage: 50000,
      created_at: expect.any(Date)
    });
  });

  it('should return null for a non-existent car ID', async () => {
    const result = await getCar(99999); // Non-existent ID
    
    expect(result).toBeNull();
  });

  it('should handle car with null optional fields', async () => {
    // Insert a car with null optional fields
    const carWithNulls = {
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      licensePlate: 'XYZ789',
      vin: '2HGBH41JXMN109187',
      nextServiceDate: null,
      nextServiceMileage: null
    };
    
    const insertedResult = await db.insert(carsTable).values(carWithNulls).returning().execute();
    const carId = insertedResult[0].id;
    
    const result = await getCar(carId);
    
    expect(result).not.toBeNull();
    expect(result).toEqual({
      id: carId,
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      licensePlate: 'XYZ789',
      vin: '2HGBH41JXMN109187',
      nextServiceDate: null,
      nextServiceMileage: null,
      created_at: expect.any(Date)
    });
  });
});
