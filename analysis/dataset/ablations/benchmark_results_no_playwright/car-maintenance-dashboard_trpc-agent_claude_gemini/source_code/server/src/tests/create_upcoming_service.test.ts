import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type CreateUpcomingServiceInput } from '../schema';
import { createUpcomingService } from '../handlers/create_upcoming_service';
import { eq } from 'drizzle-orm';

describe('createUpcomingService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCarId: number;

  beforeEach(async () => {
    // Create a test car first (required for foreign key)
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TEST123456789',
        license_plate: 'TEST123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    testCarId = carResult[0].id;
  });

  it('should create an upcoming service with all fields', async () => {
    const testInput: CreateUpcomingServiceInput = {
      car_id: testCarId,
      service_type: 'oil_change',
      description: 'Regular oil change service',
      due_date: new Date('2024-06-15'),
      due_mileage: 55000,
      notes: 'Use synthetic oil'
    };

    const result = await createUpcomingService(testInput);

    // Basic field validation
    expect(result.car_id).toEqual(testCarId);
    expect(result.service_type).toEqual('oil_change');
    expect(result.description).toEqual('Regular oil change service');
    expect(result.due_date).toEqual(new Date('2024-06-15'));
    expect(result.due_mileage).toEqual(55000);
    expect(result.notes).toEqual('Use synthetic oil');
    expect(result.is_completed).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an upcoming service with nullable fields', async () => {
    const testInput: CreateUpcomingServiceInput = {
      car_id: testCarId,
      service_type: 'brake_service',
      description: 'Brake inspection and service',
      due_date: new Date('2024-07-01'),
      due_mileage: null,
      notes: null
    };

    const result = await createUpcomingService(testInput);

    expect(result.car_id).toEqual(testCarId);
    expect(result.service_type).toEqual('brake_service');
    expect(result.description).toEqual('Brake inspection and service');
    expect(result.due_date).toEqual(new Date('2024-07-01'));
    expect(result.due_mileage).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save upcoming service to database', async () => {
    const testInput: CreateUpcomingServiceInput = {
      car_id: testCarId,
      service_type: 'tire_rotation',
      description: 'Tire rotation and balance',
      due_date: new Date('2024-08-15'),
      due_mileage: 60000,
      notes: 'Check tire pressure'
    };

    const result = await createUpcomingService(testInput);

    // Query the database to verify the record was saved
    const upcomingServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, result.id))
      .execute();

    expect(upcomingServices).toHaveLength(1);
    
    const savedService = upcomingServices[0];
    expect(savedService.car_id).toEqual(testCarId);
    expect(savedService.service_type).toEqual('tire_rotation');
    expect(savedService.description).toEqual('Tire rotation and balance');
    expect(savedService.due_date).toEqual(new Date('2024-08-15'));
    expect(savedService.due_mileage).toEqual(60000);
    expect(savedService.notes).toEqual('Check tire pressure');
    expect(savedService.is_completed).toEqual(false);
    expect(savedService.created_at).toBeInstanceOf(Date);
  });

  it('should handle different service types', async () => {
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

    // Test creating upcoming services with different service types
    for (const serviceType of serviceTypes) {
      const testInput: CreateUpcomingServiceInput = {
        car_id: testCarId,
        service_type: serviceType,
        description: `${serviceType.replace('_', ' ')} service`,
        due_date: new Date('2024-09-01'),
        due_mileage: 65000,
        notes: `Test ${serviceType} service`
      };

      const result = await createUpcomingService(testInput);
      expect(result.service_type).toEqual(serviceType);
    }
  });

  it('should throw error for invalid car_id', async () => {
    const testInput: CreateUpcomingServiceInput = {
      car_id: 99999, // Non-existent car ID
      service_type: 'oil_change',
      description: 'Oil change for non-existent car',
      due_date: new Date('2024-06-15'),
      due_mileage: 55000,
      notes: 'This should fail'
    };

    await expect(createUpcomingService(testInput))
      .rejects
      .toThrow(/violates foreign key constraint/i);
  });

  it('should handle future dates correctly', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // One year from now

    const testInput: CreateUpcomingServiceInput = {
      car_id: testCarId,
      service_type: 'inspection',
      description: 'Annual inspection',
      due_date: futureDate,
      due_mileage: 70000,
      notes: 'Annual vehicle inspection'
    };

    const result = await createUpcomingService(testInput);

    expect(result.due_date).toEqual(futureDate);
    expect(result.due_date > new Date()).toBe(true);
  });
});
