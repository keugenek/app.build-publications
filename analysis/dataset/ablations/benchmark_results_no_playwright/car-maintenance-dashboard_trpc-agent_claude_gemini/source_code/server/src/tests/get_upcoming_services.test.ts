import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type CreateCarInput, type CreateUpcomingServiceInput } from '../schema';
import { getUpcomingServices } from '../handlers/get_upcoming_services';

// Test data
const testCar: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: 'JT2AE91A123456789',
  license_plate: 'ABC123',
  current_mileage: 50000
};

const testUpcomingService1: Omit<CreateUpcomingServiceInput, 'car_id'> = {
  service_type: 'oil_change',
  description: 'Regular oil change service',
  due_date: new Date('2024-02-15'),
  due_mileage: 55000,
  notes: 'Use synthetic oil'
};

const testUpcomingService2: Omit<CreateUpcomingServiceInput, 'car_id'> = {
  service_type: 'brake_service',
  description: 'Brake pad replacement',
  due_date: new Date('2024-03-01'),
  due_mileage: null,
  notes: null
};

describe('getUpcomingServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no upcoming services exist', async () => {
    const result = await getUpcomingServices();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all upcoming services', async () => {
    // Create test car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create test upcoming services
    await db.insert(upcomingServicesTable)
      .values([
        {
          ...testUpcomingService1,
          car_id: carId
        },
        {
          ...testUpcomingService2,
          car_id: carId
        }
      ])
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(2);
    
    // Verify first service
    const service1 = result.find(s => s.service_type === 'oil_change');
    expect(service1).toBeDefined();
    expect(service1!.description).toEqual('Regular oil change service');
    expect(service1!.due_mileage).toEqual(55000);
    expect(service1!.notes).toEqual('Use synthetic oil');
    expect(service1!.is_completed).toBe(false);
    expect(service1!.car_id).toEqual(carId);
    expect(service1!.id).toBeDefined();
    expect(service1!.created_at).toBeInstanceOf(Date);

    // Verify second service
    const service2 = result.find(s => s.service_type === 'brake_service');
    expect(service2).toBeDefined();
    expect(service2!.description).toEqual('Brake pad replacement');
    expect(service2!.due_mileage).toBeNull();
    expect(service2!.notes).toBeNull();
    expect(service2!.is_completed).toBe(false);
    expect(service2!.car_id).toEqual(carId);
    expect(service2!.id).toBeDefined();
    expect(service2!.created_at).toBeInstanceOf(Date);
  });

  it('should return services from multiple cars', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        ...testCar,
        make: 'Honda'
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        ...testCar,
        make: 'Ford'
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create upcoming services for both cars
    await db.insert(upcomingServicesTable)
      .values([
        {
          ...testUpcomingService1,
          car_id: car1Id
        },
        {
          ...testUpcomingService2,
          car_id: car2Id
        }
      ])
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(2);
    
    const carIds = result.map(s => s.car_id);
    expect(carIds).toContain(car1Id);
    expect(carIds).toContain(car2Id);
  });

  it('should return services with all service types', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create services with different service types
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

    await db.insert(upcomingServicesTable)
      .values(
        serviceTypes.map((type, index) => ({
          car_id: carId,
          service_type: type,
          description: `${type} service`,
          due_date: new Date(`2024-0${(index % 9) + 1}-15`),
          due_mileage: 60000 + (index * 1000),
          notes: `Notes for ${type}`
        }))
      )
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(10);
    
    serviceTypes.forEach(type => {
      const service = result.find(s => s.service_type === type);
      expect(service).toBeDefined();
      expect(service!.description).toEqual(`${type} service`);
    });
  });

  it('should handle both completed and uncompleted services', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create one completed and one uncompleted service
    await db.insert(upcomingServicesTable)
      .values([
        {
          ...testUpcomingService1,
          car_id: carId
        },
        {
          ...testUpcomingService2,
          car_id: carId,
          is_completed: true
        }
      ])
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(2);
    
    const completedService = result.find(s => s.is_completed === true);
    const uncompletedService = result.find(s => s.is_completed === false);
    
    expect(completedService).toBeDefined();
    expect(uncompletedService).toBeDefined();
    expect(completedService!.service_type).toEqual('brake_service');
    expect(uncompletedService!.service_type).toEqual('oil_change');
  });
});
