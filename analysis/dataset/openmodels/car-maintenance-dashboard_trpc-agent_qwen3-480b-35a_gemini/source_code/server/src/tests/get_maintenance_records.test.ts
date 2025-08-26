import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { getMaintenanceRecords } from '../handlers/get_maintenance_records';
import { eq } from 'drizzle-orm';

describe('getMaintenanceRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch maintenance records for a specific car', async () => {
    // First create a car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        vin: '12345678901234567'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create some maintenance records for this car
    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: carId,
        service_type: 'Oil Change',
        date: '2023-01-15',
        mileage: 15000,
        cost: '45.99',
        notes: 'Regular oil change'
      })
      .execute();

    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: carId,
        service_type: 'Tire Rotation',
        date: '2023-06-20',
        mileage: 18000,
        cost: '25.50',
        notes: 'Rotated all tires'
      })
      .execute();

    // Test the handler
    const result = await getMaintenanceRecords(carId);

    // Validate results
    expect(result).toHaveLength(2);
    expect(result[0].car_id).toEqual(carId);
    expect(result[0].service_type).toEqual('Oil Change');
    expect(result[0].date).toEqual(new Date('2023-01-15T00:00:00.000Z'));
    expect(result[0].mileage).toEqual(15000);
    expect(result[0].cost).toEqual(45.99);
    expect(result[0].notes).toEqual('Regular oil change');
    
    expect(result[1].car_id).toEqual(carId);
    expect(result[1].service_type).toEqual('Tire Rotation');
    expect(result[1].date).toEqual(new Date('2023-06-20T00:00:00.000Z'));
    expect(result[1].mileage).toEqual(18000);
    expect(result[1].cost).toEqual(25.50);
    expect(result[1].notes).toEqual('Rotated all tires');
    
    // Verify records are ordered by date
    expect(result[0].date < result[1].date).toBe(true);
  });

  it('should return an empty array when no records exist for a car', async () => {
    // Create a car without any maintenance records
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'XYZ789',
        vin: '78901234567890123'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Test the handler
    const result = await getMaintenanceRecords(carId);

    // Validate results
    expect(result).toHaveLength(0);
  });

  it('should only return records for the specified car', async () => {
    // Create two cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        vin: '12345678901234567'
      })
      .returning()
      .execute();
    
    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        license_plate: 'XYZ789',
        vin: '78901234567890123'
      })
      .returning()
      .execute();
    
    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create maintenance records for both cars
    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car1Id,
        service_type: 'Oil Change',
        date: '2023-01-15',
        mileage: 15000,
        cost: '45.99',
        notes: 'Car 1 oil change'
      })
      .execute();

    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: car2Id,
        service_type: 'Brake Service',
        date: '2023-02-20',
        mileage: 20000,
        cost: '150.00',
        notes: 'Car 2 brake service'
      })
      .execute();

    // Test the handler for car 1
    const result = await getMaintenanceRecords(car1Id);

    // Validate that only car 1's records are returned
    expect(result).toHaveLength(1);
    expect(result[0].car_id).toEqual(car1Id);
    expect(result[0].service_type).toEqual('Oil Change');
    expect(result[0].notes).toEqual('Car 1 oil change');
  });
});
