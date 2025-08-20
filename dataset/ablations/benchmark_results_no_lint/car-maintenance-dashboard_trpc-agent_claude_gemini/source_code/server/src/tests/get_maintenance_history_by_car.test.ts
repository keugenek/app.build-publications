import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceHistoryTable } from '../db/schema';
import { type GetMaintenanceHistoryByCarInput } from '../schema';
import { getMaintenanceHistoryByCar } from '../handlers/get_maintenance_history_by_car';

describe('getMaintenanceHistoryByCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return maintenance history for a specific car ordered by service date', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1234567890ABCDEFG'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance history records with different service dates
    const olderDate = new Date('2023-01-15');
    const newerDate = new Date('2023-06-20');
    const newestDate = new Date('2023-12-10');

    await db.insert(maintenanceHistoryTable)
      .values([
        {
          car_id: carId,
          service_date: olderDate,
          service_type: 'Oil Change',
          mileage: 25000,
          cost: '45.99',
          notes: 'Regular maintenance'
        },
        {
          car_id: carId,
          service_date: newestDate,
          service_type: 'Brake Service',
          mileage: 35000,
          cost: '299.50',
          notes: 'Brake pads replaced'
        },
        {
          car_id: carId,
          service_date: newerDate,
          service_type: 'Tire Rotation',
          mileage: 30000,
          cost: '25.00',
          notes: null
        }
      ])
      .execute();

    const input: GetMaintenanceHistoryByCarInput = { car_id: carId };
    const result = await getMaintenanceHistoryByCar(input);

    // Should return all 3 records
    expect(result).toHaveLength(3);

    // Should be ordered by service date (most recent first)
    expect(result[0].service_type).toEqual('Brake Service');
    expect(result[0].service_date).toEqual(newestDate);
    expect(result[0].cost).toEqual(299.50);
    expect(typeof result[0].cost).toEqual('number');

    expect(result[1].service_type).toEqual('Tire Rotation');
    expect(result[1].service_date).toEqual(newerDate);
    expect(result[1].cost).toEqual(25.00);
    expect(result[1].notes).toBeNull();

    expect(result[2].service_type).toEqual('Oil Change');
    expect(result[2].service_date).toEqual(olderDate);
    expect(result[2].cost).toEqual(45.99);
    expect(result[2].notes).toEqual('Regular maintenance');

    // Verify all records have the correct car_id
    result.forEach(record => {
      expect(record.car_id).toEqual(carId);
      expect(record.id).toBeDefined();
      expect(record.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for car with no maintenance history', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: 'ABCDEFG1234567890'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    const input: GetMaintenanceHistoryByCarInput = { car_id: carId };
    const result = await getMaintenanceHistoryByCar(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent car', async () => {
    const input: GetMaintenanceHistoryByCarInput = { car_id: 99999 };
    const result = await getMaintenanceHistoryByCar(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return maintenance history for specified car', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2019,
        vin: '1111111111AAAAAAA'
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2020,
        vin: '2222222222BBBBBBB'
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create maintenance history for both cars
    await db.insert(maintenanceHistoryTable)
      .values([
        {
          car_id: car1Id,
          service_date: new Date('2023-03-15'),
          service_type: 'Oil Change',
          mileage: 15000,
          cost: '55.99',
          notes: 'Car 1 service'
        },
        {
          car_id: car2Id,
          service_date: new Date('2023-03-20'),
          service_type: 'Brake Check',
          mileage: 18000,
          cost: '89.99',
          notes: 'Car 2 service'
        },
        {
          car_id: car1Id,
          service_date: new Date('2023-06-10'),
          service_type: 'Transmission Service',
          mileage: 20000,
          cost: '199.99',
          notes: 'Another Car 1 service'
        }
      ])
      .execute();

    const input: GetMaintenanceHistoryByCarInput = { car_id: car1Id };
    const result = await getMaintenanceHistoryByCar(input);

    // Should only return records for car1
    expect(result).toHaveLength(2);
    result.forEach(record => {
      expect(record.car_id).toEqual(car1Id);
    });

    // Should be ordered by service date (most recent first)
    expect(result[0].service_type).toEqual('Transmission Service');
    expect(result[1].service_type).toEqual('Oil Change');
  });

  it('should handle numeric conversions correctly', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X3',
        year: 2022,
        vin: 'BMW123456789ABCDE'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance history with various cost values
    await db.insert(maintenanceHistoryTable)
      .values([
        {
          car_id: carId,
          service_date: new Date('2023-01-10'),
          service_type: 'Premium Service',
          mileage: 10000,
          cost: '1234.56', // High precision decimal
          notes: 'Expensive service'
        },
        {
          car_id: carId,
          service_date: new Date('2023-02-10'),
          service_type: 'Basic Service',
          mileage: 11000,
          cost: '0.01', // Very small amount
          notes: 'Minimal cost'
        }
      ])
      .execute();

    const input: GetMaintenanceHistoryByCarInput = { car_id: carId };
    const result = await getMaintenanceHistoryByCar(input);

    expect(result).toHaveLength(2);
    
    // Verify numeric conversion and precision
    expect(result[1].cost).toEqual(1234.56);
    expect(typeof result[1].cost).toEqual('number');
    
    expect(result[0].cost).toEqual(0.01);
    expect(typeof result[0].cost).toEqual('number');
  });
});
