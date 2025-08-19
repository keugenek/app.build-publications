import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { type GetMaintenanceEntriesByCarInput } from '../schema';
import { getMaintenanceEntriesByCarId } from '../handlers/get_maintenance_entries_by_car';

describe('getMaintenanceEntriesByCarId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when car has no maintenance entries', async () => {
    // Create a car first
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const input: GetMaintenanceEntriesByCarInput = {
      car_id: car.id
    };

    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toEqual([]);
  });

  it('should return maintenance entries for a specific car', async () => {
    // Create a car first
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    // Create maintenance entries for this car
    const [entry1, entry2] = await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car.id,
          service_date: new Date('2024-01-15'),
          mileage: 25000,
          service_type: 'oil_change',
          cost: '49.99',
          notes: 'Regular oil change'
        },
        {
          car_id: car.id,
          service_date: new Date('2024-02-20'),
          mileage: 26500,
          service_type: 'tire_rotation',
          cost: '75.00',
          notes: null
        }
      ])
      .returning()
      .execute();

    const input: GetMaintenanceEntriesByCarInput = {
      car_id: car.id
    };

    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(2);
    
    // Should be ordered by service date descending (most recent first)
    expect(result[0].service_date).toEqual(new Date('2024-02-20'));
    expect(result[1].service_date).toEqual(new Date('2024-01-15'));

    // Verify first entry (most recent)
    expect(result[0].car_id).toEqual(car.id);
    expect(result[0].mileage).toEqual(26500);
    expect(result[0].service_type).toEqual('tire_rotation');
    expect(result[0].cost).toEqual(75.00); // Should be converted to number
    expect(typeof result[0].cost).toBe('number');
    expect(result[0].notes).toBeNull();

    // Verify second entry
    expect(result[1].car_id).toEqual(car.id);
    expect(result[1].mileage).toEqual(25000);
    expect(result[1].service_type).toEqual('oil_change');
    expect(result[1].cost).toEqual(49.99); // Should be converted to number
    expect(typeof result[1].cost).toBe('number');
    expect(result[1].notes).toEqual('Regular oil change');

    // Verify timestamps are Date objects
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should only return entries for the specified car', async () => {
    // Create two cars
    const [car1, car2] = await db.insert(carsTable)
      .values([
        {
          make: 'Ford',
          model: 'Focus',
          year: 2018,
          license_plate: 'CAR111'
        },
        {
          make: 'Chevrolet',
          model: 'Malibu',
          year: 2021,
          license_plate: 'CAR222'
        }
      ])
      .returning()
      .execute();

    // Create maintenance entries for both cars
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car1.id,
          service_date: new Date('2024-01-10'),
          mileage: 30000,
          service_type: 'brake_service',
          cost: '150.00',
          notes: 'Brake pads replaced'
        },
        {
          car_id: car2.id,
          service_date: new Date('2024-01-15'),
          mileage: 15000,
          service_type: 'oil_change',
          cost: '55.00',
          notes: 'Synthetic oil'
        },
        {
          car_id: car1.id,
          service_date: new Date('2024-02-01'),
          mileage: 31000,
          service_type: 'inspection',
          cost: '25.00',
          notes: null
        }
      ])
      .execute();

    const input: GetMaintenanceEntriesByCarInput = {
      car_id: car1.id
    };

    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(2);
    
    // All entries should belong to car1
    result.forEach(entry => {
      expect(entry.car_id).toEqual(car1.id);
    });

    // Should be ordered by service date descending
    expect(result[0].service_date).toEqual(new Date('2024-02-01'));
    expect(result[1].service_date).toEqual(new Date('2024-01-10'));
  });

  it('should handle different service types correctly', async () => {
    // Create a car
    const [car] = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X3',
        year: 2020,
        license_plate: 'BMW123'
      })
      .returning()
      .execute();

    // Create maintenance entries with different service types
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car.id,
          service_date: new Date('2024-01-01'),
          mileage: 20000,
          service_type: 'engine_tune_up',
          cost: '300.00',
          notes: 'Full tune-up'
        },
        {
          car_id: car.id,
          service_date: new Date('2024-01-15'),
          mileage: 20500,
          service_type: 'air_filter_replacement',
          cost: '25.99',
          notes: 'Cabin filter replaced'
        },
        {
          car_id: car.id,
          service_date: new Date('2024-02-01'),
          mileage: 21000,
          service_type: 'battery_replacement',
          cost: '120.00',
          notes: null
        }
      ])
      .execute();

    const input: GetMaintenanceEntriesByCarInput = {
      car_id: car.id
    };

    const result = await getMaintenanceEntriesByCarId(input);

    expect(result).toHaveLength(3);

    // Verify service types are preserved correctly
    const serviceTypes = result.map(entry => entry.service_type);
    expect(serviceTypes).toContain('engine_tune_up');
    expect(serviceTypes).toContain('air_filter_replacement');
    expect(serviceTypes).toContain('battery_replacement');

    // Verify cost conversions
    result.forEach(entry => {
      expect(typeof entry.cost).toBe('number');
      expect(entry.cost).toBeGreaterThan(0);
    });
  });
});
