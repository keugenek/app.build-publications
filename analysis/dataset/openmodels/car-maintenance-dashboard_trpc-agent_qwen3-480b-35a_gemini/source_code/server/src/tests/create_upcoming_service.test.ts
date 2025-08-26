import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type CreateUpcomingServiceInput } from '../schema';
import { createUpcomingService } from '../handlers/create_upcoming_service';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUpcomingServiceInput = {
  car_id: 1,
  service_type: 'Oil Change',
  due_date: new Date('2023-12-31'),
  due_mileage: 15000,
  notes: 'Regular oil change'
};

describe('createUpcomingService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an upcoming service', async () => {
    // First create a car since upcoming service requires a valid car_id
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
    
    // Update test input with valid car_id
    const inputWithValidCarId: CreateUpcomingServiceInput = {
      ...testInput,
      car_id: carId
    };

    const result = await createUpcomingService(inputWithValidCarId);

    // Basic field validation
    expect(result.car_id).toEqual(carId);
    expect(result.service_type).toEqual('Oil Change');
    expect(result.due_date).toEqual(new Date('2023-12-31'));
    expect(result.due_mileage).toEqual(15000);
    expect(result.notes).toEqual('Regular oil change');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save upcoming service to database', async () => {
    // First create a car since upcoming service requires a valid car_id
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'XYZ789',
        vin: '76543210987654321'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;
    
    // Update test input with valid car_id
    const inputWithValidCarId: CreateUpcomingServiceInput = {
      ...testInput,
      car_id: carId
    };

    const result = await createUpcomingService(inputWithValidCarId);

    // Query using proper drizzle syntax
    const upcomingServices = await db.select()
      .from(upcomingServicesTable)
      .where(eq(upcomingServicesTable.id, result.id))
      .execute();

    expect(upcomingServices).toHaveLength(1);
    expect(upcomingServices[0].car_id).toEqual(carId);
    expect(upcomingServices[0].service_type).toEqual('Oil Change');
    // Database stores dates as strings, so we need to convert for comparison
    expect(upcomingServices[0].due_date).toEqual('2023-12-31');
    expect(upcomingServices[0].due_mileage).toEqual(15000);
    expect(upcomingServices[0].notes).toEqual('Regular oil change');
    expect(upcomingServices[0].created_at).toBeInstanceOf(Date);
  });

  it('should create upcoming service with nullable fields', async () => {
    // First create a car since upcoming service requires a valid car_id
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'Focus',
        year: 2019,
        license_plate: 'DEF456',
        vin: '19283746501234567'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;
    
    // Test input with null values for optional fields
    const inputWithNulls: CreateUpcomingServiceInput = {
      car_id: carId,
      service_type: 'Tire Rotation'
    };

    const result = await createUpcomingService(inputWithNulls);

    // Basic field validation
    expect(result.car_id).toEqual(carId);
    expect(result.service_type).toEqual('Tire Rotation');
    expect(result.due_date).toBeNull();
    expect(result.due_mileage).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
