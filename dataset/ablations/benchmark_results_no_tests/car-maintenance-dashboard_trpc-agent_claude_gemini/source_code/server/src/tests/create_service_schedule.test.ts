import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceSchedulesTable } from '../db/schema';
import { type CreateServiceScheduleInput } from '../schema';
import { createServiceSchedule } from '../handlers/create_service_schedule';
import { eq } from 'drizzle-orm';

// Test data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123',
  current_mileage: 50000
};

const testServiceScheduleTime: CreateServiceScheduleInput = {
  car_id: 0, // Will be set after creating test car
  service_type: 'Oil Change',
  interval_type: 'time' as const,
  interval_value: 6, // 6 months
  last_service_date: new Date('2024-01-01'),
  last_service_mileage: null
};

const testServiceScheduleMileage: CreateServiceScheduleInput = {
  car_id: 0, // Will be set after creating test car
  service_type: 'Tire Rotation',
  interval_type: 'mileage' as const,
  interval_value: 10000, // 10,000 miles
  last_service_date: null,
  last_service_mileage: 40000
};

describe('createServiceSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a time-based service schedule', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testServiceScheduleTime, car_id: car.id };

    const result = await createServiceSchedule(input);

    // Basic field validation
    expect(result.car_id).toEqual(car.id);
    expect(result.service_type).toEqual('Oil Change');
    expect(result.interval_type).toEqual('time');
    expect(result.interval_value).toEqual(6);
    expect(result.last_service_date).toEqual(new Date('2024-01-01'));
    expect(result.last_service_mileage).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify next service date calculation (6 months from last service)
    expect(result.next_service_date).toBeInstanceOf(Date);
    expect(result.next_service_date).toEqual(new Date('2024-07-01'));
    expect(result.next_service_mileage).toBeNull();
  });

  it('should create a mileage-based service schedule', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testServiceScheduleMileage, car_id: car.id };

    const result = await createServiceSchedule(input);

    // Basic field validation
    expect(result.car_id).toEqual(car.id);
    expect(result.service_type).toEqual('Tire Rotation');
    expect(result.interval_type).toEqual('mileage');
    expect(result.interval_value).toEqual(10000);
    expect(result.last_service_date).toBeNull();
    expect(result.last_service_mileage).toEqual(40000);
    expect(result.is_active).toBe(true);

    // Verify next service mileage calculation (40000 + 10000 = 50000)
    expect(result.next_service_mileage).toEqual(50000);
    expect(result.next_service_date).toBeNull();
  });

  it('should save service schedule to database', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    const input = { ...testServiceScheduleTime, car_id: car.id };

    const result = await createServiceSchedule(input);

    // Query database to verify record was saved
    const schedules = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].car_id).toEqual(car.id);
    expect(schedules[0].service_type).toEqual('Oil Change');
    expect(schedules[0].interval_type).toEqual('time');
    expect(schedules[0].interval_value).toEqual(6);
    expect(schedules[0].is_active).toBe(true);
    expect(schedules[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null last service values correctly', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    
    // Test with no last service data
    const input: CreateServiceScheduleInput = {
      car_id: car.id,
      service_type: 'Brake Inspection',
      interval_type: 'time',
      interval_value: 12,
      last_service_date: null,
      last_service_mileage: null
    };

    const result = await createServiceSchedule(input);

    expect(result.last_service_date).toBeNull();
    expect(result.last_service_mileage).toBeNull();
    expect(result.next_service_date).toBeNull();
    expect(result.next_service_mileage).toBeNull();
  });

  it('should throw error when car does not exist', async () => {
    const input = { ...testServiceScheduleTime, car_id: 999999 };

    await expect(createServiceSchedule(input)).rejects.toThrow(/car with id 999999 not found/i);
  });

  it('should calculate next service date correctly for different months', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const car = carResult[0];
    
    // Test with December date to ensure year rollover works
    const input: CreateServiceScheduleInput = {
      car_id: car.id,
      service_type: 'Winter Service',
      interval_type: 'time',
      interval_value: 3,
      last_service_date: new Date('2023-12-15'),
      last_service_mileage: null
    };

    const result = await createServiceSchedule(input);

    // Should be March 15, 2024
    expect(result.next_service_date).toEqual(new Date('2024-03-15'));
  });
});
