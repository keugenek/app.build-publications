import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { type GetMaintenanceRecordsByCarInput } from '../schema';
import { getMaintenanceRecordsByCarId } from '../handlers/get_maintenance_records_by_car';

describe('getMaintenanceRecordsByCarId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return maintenance records for a specific car', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1234567890',
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create test maintenance records for this car
    const testRecords = [
      {
        car_id: carId,
        service_date: new Date('2023-06-15'),
        service_type: 'oil_change' as const,
        description: 'Regular oil change',
        cost: '45.99',
        mileage: 48000,
        notes: 'Used synthetic oil'
      },
      {
        car_id: carId,
        service_date: new Date('2023-09-10'),
        service_type: 'tire_rotation' as const,
        description: 'Tire rotation and balance',
        cost: '75.50',
        mileage: 50000,
        notes: null
      },
      {
        car_id: carId,
        service_date: new Date('2023-03-20'),
        service_type: 'brake_service' as const,
        description: 'Brake pad replacement',
        cost: '225.00',
        mileage: 45000,
        notes: 'Front brake pads only'
      }
    ];

    await db.insert(maintenanceRecordsTable)
      .values(testRecords)
      .execute();

    // Test the handler
    const input: GetMaintenanceRecordsByCarInput = { car_id: carId };
    const result = await getMaintenanceRecordsByCarId(input);

    // Should return all 3 records
    expect(result).toHaveLength(3);

    // Verify records are ordered by service_date descending (newest first)
    expect(result[0].service_date).toEqual(new Date('2023-09-10'));
    expect(result[1].service_date).toEqual(new Date('2023-06-15'));
    expect(result[2].service_date).toEqual(new Date('2023-03-20'));

    // Verify numeric conversion for cost field
    expect(typeof result[0].cost).toBe('number');
    expect(result[0].cost).toBe(75.50);
    expect(result[1].cost).toBe(45.99);
    expect(result[2].cost).toBe(225.00);

    // Verify all fields are correctly returned
    expect(result[0].service_type).toBe('tire_rotation');
    expect(result[0].description).toBe('Tire rotation and balance');
    expect(result[0].mileage).toBe(50000);
    expect(result[0].notes).toBeNull();
    
    expect(result[1].service_type).toBe('oil_change');
    expect(result[1].description).toBe('Regular oil change');
    expect(result[1].mileage).toBe(48000);
    expect(result[1].notes).toBe('Used synthetic oil');
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when car has no maintenance records', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: '9876543210',
        license_plate: 'XYZ789',
        current_mileage: 30000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Test the handler with car that has no maintenance records
    const input: GetMaintenanceRecordsByCarInput = { car_id: carId };
    const result = await getMaintenanceRecordsByCarId(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when car does not exist', async () => {
    // Use a car ID that doesn't exist
    const input: GetMaintenanceRecordsByCarInput = { car_id: 999 };
    const result = await getMaintenanceRecordsByCarId(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return records for the specified car', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1111111111',
        license_plate: 'CAR001',
        current_mileage: 40000
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        vin: '2222222222',
        license_plate: 'CAR002',
        current_mileage: 25000
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create maintenance records for both cars
    await db.insert(maintenanceRecordsTable)
      .values([
        {
          car_id: car1Id,
          service_date: new Date('2023-05-15'),
          service_type: 'oil_change',
          description: 'Car 1 oil change',
          cost: '45.99',
          mileage: 39000,
          notes: null
        },
        {
          car_id: car1Id,
          service_date: new Date('2023-07-20'),
          service_type: 'tire_rotation',
          description: 'Car 1 tire rotation',
          cost: '65.00',
          mileage: 40000,
          notes: null
        },
        {
          car_id: car2Id,
          service_date: new Date('2023-06-10'),
          service_type: 'brake_service',
          description: 'Car 2 brake service',
          cost: '180.75',
          mileage: 24000,
          notes: 'Rear brakes'
        }
      ])
      .execute();

    // Test getting records for car 1
    const input1: GetMaintenanceRecordsByCarInput = { car_id: car1Id };
    const result1 = await getMaintenanceRecordsByCarId(input1);

    expect(result1).toHaveLength(2);
    result1.forEach(record => {
      expect(record.car_id).toBe(car1Id);
    });

    // Test getting records for car 2
    const input2: GetMaintenanceRecordsByCarInput = { car_id: car2Id };
    const result2 = await getMaintenanceRecordsByCarId(input2);

    expect(result2).toHaveLength(1);
    expect(result2[0].car_id).toBe(car2Id);
    expect(result2[0].description).toBe('Car 2 brake service');
    expect(result2[0].cost).toBe(180.75);
  });

  it('should handle records with various service types correctly', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        vin: '3333333333',
        license_plate: 'TRUCK1',
        current_mileage: 15000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance records with different service types
    const serviceTypes = [
      'oil_change',
      'tire_rotation',
      'brake_service',
      'engine_tune_up',
      'transmission_service',
      'coolant_flush',
      'air_filter_replacement',
      'battery_replacement',
      'inspection',
      'other'
    ] as const;

    const testRecords = serviceTypes.map((serviceType, index) => ({
      car_id: carId,
      service_date: new Date(`2023-${String(index + 1).padStart(2, '0')}-15`),
      service_type: serviceType,
      description: `${serviceType.replace('_', ' ')} service`,
      cost: (50 + index * 10).toString(),
      mileage: 10000 + index * 500,
      notes: index % 2 === 0 ? `Notes for ${serviceType}` : null
    }));

    await db.insert(maintenanceRecordsTable)
      .values(testRecords)
      .execute();

    // Test the handler
    const input: GetMaintenanceRecordsByCarInput = { car_id: carId };
    const result = await getMaintenanceRecordsByCarId(input);

    expect(result).toHaveLength(10);

    // Verify all service types are present and correctly handled
    const returnedServiceTypes = result.map(r => r.service_type).sort();
    expect(returnedServiceTypes).toEqual([...serviceTypes].sort());

    // Verify ordering (newest first - so 'other' should be first, 'oil_change' last)
    expect(result[0].service_type).toBe('other');
    expect(result[result.length - 1].service_type).toBe('oil_change');

    // Verify numeric conversion and other fields
    result.forEach((record, index) => {
      expect(typeof record.cost).toBe('number');
      expect(record.cost).toBeGreaterThan(0);
      expect(record.mileage).toBeGreaterThanOrEqual(10000);
      expect(record.created_at).toBeInstanceOf(Date);
    });
  });
});
