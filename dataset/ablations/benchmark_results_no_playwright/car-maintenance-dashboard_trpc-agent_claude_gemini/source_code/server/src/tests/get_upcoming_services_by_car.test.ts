import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { type GetUpcomingServicesByCarInput } from '../schema';
import { getUpcomingServicesByCarId } from '../handlers/get_upcoming_services_by_car';

describe('getUpcomingServicesByCarId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return upcoming services for a specific car', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186',
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create test upcoming services
    const service1 = await db.insert(upcomingServicesTable)
      .values({
        car_id: carId,
        service_type: 'oil_change',
        description: 'Regular oil change',
        due_date: new Date('2024-03-15'),
        due_mileage: 55000,
        is_completed: false,
        notes: 'Use synthetic oil'
      })
      .returning()
      .execute();

    const service2 = await db.insert(upcomingServicesTable)
      .values({
        car_id: carId,
        service_type: 'tire_rotation',
        description: 'Rotate all four tires',
        due_date: new Date('2024-04-01'),
        due_mileage: null,
        is_completed: false,
        notes: null
      })
      .returning()
      .execute();

    const input: GetUpcomingServicesByCarInput = {
      car_id: carId
    };

    const result = await getUpcomingServicesByCarId(input);

    // Should return both services
    expect(result).toHaveLength(2);

    // Verify service details
    const oilChangeService = result.find(s => s.service_type === 'oil_change');
    const tireRotationService = result.find(s => s.service_type === 'tire_rotation');

    expect(oilChangeService).toBeDefined();
    expect(oilChangeService!.id).toEqual(service1[0].id);
    expect(oilChangeService!.car_id).toEqual(carId);
    expect(oilChangeService!.description).toEqual('Regular oil change');
    expect(oilChangeService!.due_date).toBeInstanceOf(Date);
    expect(oilChangeService!.due_mileage).toEqual(55000);
    expect(oilChangeService!.is_completed).toEqual(false);
    expect(oilChangeService!.notes).toEqual('Use synthetic oil');
    expect(oilChangeService!.created_at).toBeInstanceOf(Date);

    expect(tireRotationService).toBeDefined();
    expect(tireRotationService!.id).toEqual(service2[0].id);
    expect(tireRotationService!.car_id).toEqual(carId);
    expect(tireRotationService!.description).toEqual('Rotate all four tires');
    expect(tireRotationService!.due_date).toBeInstanceOf(Date);
    expect(tireRotationService!.due_mileage).toBeNull();
    expect(tireRotationService!.is_completed).toEqual(false);
    expect(tireRotationService!.notes).toBeNull();
  });

  it('should return empty array when car has no upcoming services', async () => {
    // Create a test car without any upcoming services
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: null,
        license_plate: null,
        current_mileage: 30000
      })
      .returning()
      .execute();

    const input: GetUpcomingServicesByCarInput = {
      car_id: carResult[0].id
    };

    const result = await getUpcomingServicesByCarId(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return services for the specified car', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F150',
        year: 2021,
        vin: null,
        license_plate: null,
        current_mileage: 25000
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2022,
        vin: null,
        license_plate: null,
        current_mileage: 15000
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create upcoming services for both cars
    await db.insert(upcomingServicesTable)
      .values({
        car_id: car1Id,
        service_type: 'oil_change',
        description: 'Oil change for Ford',
        due_date: new Date('2024-03-15'),
        due_mileage: 30000,
        is_completed: false,
        notes: null
      })
      .execute();

    await db.insert(upcomingServicesTable)
      .values({
        car_id: car2Id,
        service_type: 'brake_service',
        description: 'Brake service for Chevy',
        due_date: new Date('2024-04-10'),
        due_mileage: 20000,
        is_completed: false,
        notes: null
      })
      .execute();

    await db.insert(upcomingServicesTable)
      .values({
        car_id: car1Id,
        service_type: 'inspection',
        description: 'Annual inspection for Ford',
        due_date: new Date('2024-05-01'),
        due_mileage: null,
        is_completed: false,
        notes: 'State inspection required'
      })
      .execute();

    const input: GetUpcomingServicesByCarInput = {
      car_id: car1Id
    };

    const result = await getUpcomingServicesByCarId(input);

    // Should return only services for car1
    expect(result).toHaveLength(2);
    result.forEach(service => {
      expect(service.car_id).toEqual(car1Id);
    });

    // Verify correct services are returned
    const serviceTypes = result.map(s => s.service_type);
    expect(serviceTypes).toContain('oil_change');
    expect(serviceTypes).toContain('inspection');
    expect(serviceTypes).not.toContain('brake_service');
  });

  it('should handle completed and incomplete services correctly', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Nissan',
        model: 'Altima',
        year: 2018,
        vin: null,
        license_plate: null,
        current_mileage: 80000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create both completed and incomplete upcoming services
    await db.insert(upcomingServicesTable)
      .values({
        car_id: carId,
        service_type: 'oil_change',
        description: 'Completed oil change',
        due_date: new Date('2024-01-15'),
        due_mileage: 75000,
        is_completed: true,
        notes: 'Completed early'
      })
      .execute();

    await db.insert(upcomingServicesTable)
      .values({
        car_id: carId,
        service_type: 'tire_rotation',
        description: 'Upcoming tire rotation',
        due_date: new Date('2024-03-20'),
        due_mileage: 85000,
        is_completed: false,
        notes: null
      })
      .execute();

    const input: GetUpcomingServicesByCarInput = {
      car_id: carId
    };

    const result = await getUpcomingServicesByCarId(input);

    // Should return both completed and incomplete services
    expect(result).toHaveLength(2);

    const completedService = result.find(s => s.is_completed === true);
    const incompleteService = result.find(s => s.is_completed === false);

    expect(completedService).toBeDefined();
    expect(completedService!.service_type).toEqual('oil_change');
    expect(completedService!.description).toEqual('Completed oil change');

    expect(incompleteService).toBeDefined();
    expect(incompleteService!.service_type).toEqual('tire_rotation');
    expect(incompleteService!.description).toEqual('Upcoming tire rotation');
  });

  it('should throw error when car does not exist', async () => {
    const input: GetUpcomingServicesByCarInput = {
      car_id: 999 // Non-existent car ID
    };

    await expect(getUpcomingServicesByCarId(input)).rejects.toThrow(/car with id 999 not found/i);
  });
});
