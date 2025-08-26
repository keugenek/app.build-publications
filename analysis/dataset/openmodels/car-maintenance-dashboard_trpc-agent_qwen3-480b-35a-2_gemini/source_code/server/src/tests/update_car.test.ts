import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Test data for creating a car directly with database
const createCarData = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  vin: '12345678901234567',
  nextServiceDate: '2024-12-31', // Store as string for database
  nextServiceMileage: 50000
};

// Test data for updating a car
const updateCarInput: UpdateCarInput = {
  id: 1,
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  licensePlate: 'XYZ789',
  vin: '76543210987654321',
  nextServiceDate: new Date('2025-01-15'), // As Date object for handler
  nextServiceMileage: 60000
};

describe('updateCar', () => {
  beforeEach(async () => {
    await createDB();
    // Create a car to update
    await db.insert(carsTable).values(createCarData).execute();
  });
  
  afterEach(resetDB);

  it('should update a car with all fields', async () => {
    const result = await updateCar(updateCarInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.make).toEqual('Honda');
    expect(result.model).toEqual('Civic');
    expect(result.year).toEqual(2021);
    expect(result.licensePlate).toEqual('XYZ789');
    expect(result.vin).toEqual('76543210987654321');
    expect(result.nextServiceDate).toEqual(new Date('2025-01-15'));
    expect(result.nextServiceMileage).toEqual(60000);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update specific fields of a car', async () => {
    const partialUpdateInput: UpdateCarInput = {
      id: 1,
      make: 'Nissan',
      model: 'Altima'
    };

    const result = await updateCar(partialUpdateInput);

    // Updated fields
    expect(result.make).toEqual('Nissan');
    expect(result.model).toEqual('Altima');
    
    // Unchanged fields should remain the same
    expect(result.year).toEqual(2020);
    expect(result.licensePlate).toEqual('ABC123');
    expect(result.vin).toEqual('12345678901234567');
    
    // For date comparisons, we need to convert to strings or compare properly
    expect(result.nextServiceDate).toEqual(new Date('2024-12-31'));
    expect(result.nextServiceMileage).toEqual(50000);
  });

  it('should save updated car to database', async () => {
    await updateCar(updateCarInput);

    // Query the updated car from database
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, 1))
      .execute();

    expect(cars).toHaveLength(1);
    const car = cars[0];
    expect(car.make).toEqual('Honda');
    expect(car.model).toEqual('Civic');
    expect(car.year).toEqual(2021);
    expect(car.licensePlate).toEqual('XYZ789');
    expect(car.vin).toEqual('76543210987654321');
    
    // For database date values, we need to convert to Date for comparison
    expect(car.nextServiceDate).toEqual('2025-01-15');
    expect(car.nextServiceMileage).toEqual(60000);
  });

  it('should throw error when updating non-existent car', async () => {
    const invalidUpdateInput: UpdateCarInput = {
      id: 999,
      make: 'Non-existent'
    };

    await expect(updateCar(invalidUpdateInput)).rejects.toThrow(/not found/i);
  });
});
