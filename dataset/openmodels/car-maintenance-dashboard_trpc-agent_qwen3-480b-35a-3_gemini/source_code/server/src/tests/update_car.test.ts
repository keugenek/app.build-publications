import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Helper function to create a test car
const createTestCar = async (): Promise<Car> => {
  const result = await db.insert(carsTable)
    .values({
      make: 'Test Make',
      model: 'Test Model',
      year: 2020,
      vin: '1HGBH41JXMN109186',
      current_mileage: 15000
    })
    .returning()
    .execute();
    
  return result[0];
};

describe('updateCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a car with all fields provided', async () => {
    // Create a test car first
    const car = await createTestCar();
    
    // Update all fields
    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Updated Make',
      model: 'Updated Model',
      year: 2022,
      vin: 'UPDATEDVIN123456789',
      current_mileage: 25000
    };
    
    const result = await updateCar(updateInput);
    
    // Verify the returned data
    expect(result.id).toEqual(car.id);
    expect(result.make).toEqual('Updated Make');
    expect(result.model).toEqual('Updated Model');
    expect(result.year).toEqual(2022);
    expect(result.vin).toEqual('UPDATEDVIN123456789');
    expect(result.current_mileage).toEqual(25000);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(car.updated_at.getTime());
    
    // Verify the database was updated
    const dbCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();
      
    expect(dbCar).toHaveLength(1);
    expect(dbCar[0].make).toEqual('Updated Make');
    expect(dbCar[0].model).toEqual('Updated Model');
    expect(dbCar[0].year).toEqual(2022);
    expect(dbCar[0].vin).toEqual('UPDATEDVIN123456789');
    expect(dbCar[0].current_mileage).toEqual(25000);
  });

  it('should update only specified fields', async () => {
    // Create a test car first
    const car = await createTestCar();
    
    // Update only some fields
    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Partially Updated Make',
      current_mileage: 30000
    };
    
    const result = await updateCar(updateInput);
    
    // Verify the returned data
    expect(result.id).toEqual(car.id);
    expect(result.make).toEqual('Partially Updated Make');
    expect(result.model).toEqual(car.model); // Should remain unchanged
    expect(result.year).toEqual(car.year); // Should remain unchanged
    expect(result.vin).toEqual(car.vin); // Should remain unchanged
    expect(result.current_mileage).toEqual(30000); // Should be updated
    expect(result.updated_at.getTime()).toBeGreaterThan(car.updated_at.getTime());
  });

  it('should throw an error when trying to update a non-existent car', async () => {
    const updateInput: UpdateCarInput = {
      id: 99999,
      make: 'Non-existent Car'
    };
    
    await expect(updateCar(updateInput)).rejects.toThrow(/Car with id 99999 not found/);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a test car first
    const car = await createTestCar();
    
    // Store the original updated_at timestamp
    const originalUpdatedAt = car.updated_at;
    
    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update the car
    const updateInput: UpdateCarInput = {
      id: car.id,
      make: 'Timestamp Test'
    };
    
    const result = await updateCar(updateInput);
    
    // Verify the updated_at timestamp was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
