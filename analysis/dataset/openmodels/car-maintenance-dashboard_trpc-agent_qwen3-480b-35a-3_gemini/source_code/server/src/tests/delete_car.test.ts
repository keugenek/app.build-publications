import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteCar } from '../handlers/delete_car';

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a car and its associated maintenance entries', async () => {
    // First create a car directly
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186',
        current_mileage: 15000
      })
      .returning()
      .execute();

    // Create maintenance entries for the car
    await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        date: new Date('2023-01-15'),
        service_type: 'Oil Change',
        cost: '50.00',
        mileage_at_service: 10000,
        notes: 'Regular oil change'
      })
      .execute();

    await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        date: new Date('2023-07-20'),
        service_type: 'Tire Rotation',
        cost: '75.00',
        mileage_at_service: 12500,
        notes: null
      })
      .execute();

    // Verify the car and maintenance entries exist
    const carsBefore = await db.select().from(carsTable).where(eq(carsTable.id, car.id)).execute();
    const maintenanceEntriesBefore = await db.select().from(maintenanceEntriesTable).where(eq(maintenanceEntriesTable.car_id, car.id)).execute();
    
    expect(carsBefore).toHaveLength(1);
    expect(maintenanceEntriesBefore).toHaveLength(2);

    // Delete the car
    const result = await deleteCar(car.id);
    
    expect(result).toBe(true);

    // Verify the car and maintenance entries are deleted
    const carsAfter = await db.select().from(carsTable).where(eq(carsTable.id, car.id)).execute();
    const maintenanceEntriesAfter = await db.select().from(maintenanceEntriesTable).where(eq(maintenanceEntriesTable.car_id, car.id)).execute();
    
    expect(carsAfter).toHaveLength(0);
    expect(maintenanceEntriesAfter).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent car', async () => {
    const result = await deleteCar(99999); // Non-existent car ID
    expect(result).toBe(false);
  });

  it('should handle deletion of a car with no maintenance entries', async () => {
    // Create a car without maintenance entries
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        vin: '2HGBH41JXMN109187',
        current_mileage: 5000
      })
      .returning()
      .execute();

    // Verify the car exists but has no maintenance entries
    const carsBefore = await db.select().from(carsTable).where(eq(carsTable.id, car.id)).execute();
    const maintenanceEntriesBefore = await db.select().from(maintenanceEntriesTable).where(eq(maintenanceEntriesTable.car_id, car.id)).execute();
    
    expect(carsBefore).toHaveLength(1);
    expect(maintenanceEntriesBefore).toHaveLength(0);

    // Delete the car
    const result = await deleteCar(car.id);
    
    expect(result).toBe(true);

    // Verify the car is deleted
    const carsAfter = await db.select().from(carsTable).where(eq(carsTable.id, car.id)).execute();
    expect(carsAfter).toHaveLength(0);
  });
});
