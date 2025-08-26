import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { getMaintenanceRecords } from '../handlers/get_maintenance_records';
import { eq } from 'drizzle-orm';

describe('getMaintenanceRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no maintenance records exist', async () => {
    const result = await getMaintenanceRecords();
    
    expect(result).toEqual([]);
  });

  it('should return all maintenance records', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TEST123456789',
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create test maintenance records
    const testRecords = [
      {
        car_id: carId,
        service_date: new Date('2024-01-15'),
        service_type: 'oil_change' as const,
        description: 'Regular oil change',
        cost: '49.99',
        mileage: 45000,
        notes: 'Used synthetic oil'
      },
      {
        car_id: carId,
        service_date: new Date('2024-02-20'),
        service_type: 'tire_rotation' as const,
        description: 'Tire rotation and balancing',
        cost: '75.00',
        mileage: 47500,
        notes: null
      }
    ];

    await db.insert(maintenanceRecordsTable)
      .values(testRecords)
      .execute();

    const result = await getMaintenanceRecords();

    expect(result).toHaveLength(2);

    // Check first record
    const firstRecord = result[0];
    expect(firstRecord.car_id).toBe(carId);
    expect(firstRecord.service_date).toBeInstanceOf(Date);
    expect(firstRecord.service_type).toBe('oil_change');
    expect(firstRecord.description).toBe('Regular oil change');
    expect(firstRecord.cost).toBe(49.99);
    expect(typeof firstRecord.cost).toBe('number');
    expect(firstRecord.mileage).toBe(45000);
    expect(firstRecord.notes).toBe('Used synthetic oil');
    expect(firstRecord.id).toBeDefined();
    expect(firstRecord.created_at).toBeInstanceOf(Date);

    // Check second record
    const secondRecord = result[1];
    expect(secondRecord.car_id).toBe(carId);
    expect(secondRecord.service_date).toBeInstanceOf(Date);
    expect(secondRecord.service_type).toBe('tire_rotation');
    expect(secondRecord.description).toBe('Tire rotation and balancing');
    expect(secondRecord.cost).toBe(75.00);
    expect(typeof secondRecord.cost).toBe('number');
    expect(secondRecord.mileage).toBe(47500);
    expect(secondRecord.notes).toBeNull();
    expect(secondRecord.id).toBeDefined();
    expect(secondRecord.created_at).toBeInstanceOf(Date);
  });

  it('should return maintenance records from multiple cars', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TEST123456789',
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: 'TEST987654321',
        license_plate: 'XYZ789',
        current_mileage: 60000
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create maintenance records for both cars
    const testRecords = [
      {
        car_id: car1Id,
        service_date: new Date('2024-01-15'),
        service_type: 'oil_change' as const,
        description: 'Oil change for Toyota',
        cost: '49.99',
        mileage: 45000,
        notes: null
      },
      {
        car_id: car2Id,
        service_date: new Date('2024-01-20'),
        service_type: 'brake_service' as const,
        description: 'Brake pad replacement for Honda',
        cost: '150.00',
        mileage: 58000,
        notes: 'Front brake pads replaced'
      }
    ];

    await db.insert(maintenanceRecordsTable)
      .values(testRecords)
      .execute();

    const result = await getMaintenanceRecords();

    expect(result).toHaveLength(2);
    
    // Should contain records from both cars
    const carIds = result.map(record => record.car_id);
    expect(carIds).toContain(car1Id);
    expect(carIds).toContain(car2Id);
  });

  it('should correctly handle numeric cost conversion', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        vin: 'TESTVIN123',
        license_plate: 'TRUCK1',
        current_mileage: 30000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance record with high precision cost
    await db.insert(maintenanceRecordsTable)
      .values({
        car_id: carId,
        service_date: new Date('2024-01-15'),
        service_type: 'engine_tune_up',
        description: 'Complete engine tune-up',
        cost: '299.95', // Store as string (numeric in DB)
        mileage: 28000,
        notes: 'Full service performed'
      })
      .execute();

    const result = await getMaintenanceRecords();

    expect(result).toHaveLength(1);
    expect(result[0].cost).toBe(299.95);
    expect(typeof result[0].cost).toBe('number');
  });

  it('should verify maintenance records are saved to database correctly', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X3',
        year: 2022,
        vin: 'BMWTEST123456',
        license_plate: 'BMW123',
        current_mileage: 25000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Insert a maintenance record directly
    const insertResult = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: carId,
        service_date: new Date('2024-03-01'),
        service_type: 'inspection',
        description: 'Annual vehicle inspection',
        cost: '85.00',
        mileage: 24500,
        notes: 'Passed inspection'
      })
      .returning()
      .execute();

    // Fetch via handler
    const handlerResult = await getMaintenanceRecords();

    // Verify direct database query matches handler result
    const dbRecord = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, insertResult[0].id))
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].id).toBe(insertResult[0].id);
    expect(handlerResult[0].description).toBe('Annual vehicle inspection');
    expect(handlerResult[0].cost).toBe(85.00);
    
    // Verify the database stores cost as string but handler returns number
    expect(typeof dbRecord[0].cost).toBe('string');
    expect(typeof handlerResult[0].cost).toBe('number');
    expect(parseFloat(dbRecord[0].cost)).toBe(handlerResult[0].cost);
  });
});
