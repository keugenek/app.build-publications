import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceSchedulesTable } from '../db/schema';
import { getUpcomingServices } from '../handlers/get_upcoming_services';

describe('getUpcomingServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no upcoming services exist', async () => {
    const result = await getUpcomingServices();
    expect(result).toEqual([]);
  });

  it('should return services due within 30 days for time-based schedules', async () => {
    // Create a test car
    const car = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    // Create service schedule due in 15 days
    const nextServiceDate = new Date();
    nextServiceDate.setDate(nextServiceDate.getDate() + 15);

    const lastServiceDate = new Date();
    lastServiceDate.setDate(lastServiceDate.getDate() - 75); // 3 months ago

    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Oil Change',
        interval_type: 'time',
        interval_value: 3, // 3 months
        last_service_date: lastServiceDate,
        last_service_mileage: 47000,
        next_service_date: nextServiceDate,
        next_service_mileage: null,
        is_active: true
      })
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(1);
    expect(result[0].service_type).toBe('Oil Change');
    expect(result[0].car_id).toBe(car[0].id);
    expect(result[0].interval_type).toBe('time');
    expect(result[0].next_service_date).toEqual(nextServiceDate);
  });

  it('should return services due within 1000 miles for mileage-based schedules', async () => {
    // Create a test car
    const car = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789',
        current_mileage: 59500 // 500 miles from next service
      })
      .returning()
      .execute();

    // Create service schedule due at 60000 miles
    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Tire Rotation',
        interval_type: 'mileage',
        interval_value: 5000, // every 5000 miles
        last_service_date: null,
        last_service_mileage: 55000,
        next_service_date: null,
        next_service_mileage: 60000,
        is_active: true
      })
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(1);
    expect(result[0].service_type).toBe('Tire Rotation');
    expect(result[0].car_id).toBe(car[0].id);
    expect(result[0].interval_type).toBe('mileage');
    expect(result[0].next_service_mileage).toBe(60000);
  });

  it('should not return services due beyond 30 days', async () => {
    // Create a test car
    const car = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F150',
        year: 2021,
        license_plate: 'DEF456',
        current_mileage: 30000
      })
      .returning()
      .execute();

    // Create service schedule due in 45 days (beyond threshold)
    const nextServiceDate = new Date();
    nextServiceDate.setDate(nextServiceDate.getDate() + 45);

    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Brake Inspection',
        interval_type: 'time',
        interval_value: 6, // 6 months
        last_service_date: null,
        last_service_mileage: null,
        next_service_date: nextServiceDate,
        next_service_mileage: null,
        is_active: true
      })
      .execute();

    const result = await getUpcomingServices();
    expect(result).toHaveLength(0);
  });

  it('should not return services due beyond 1000 miles', async () => {
    // Create a test car
    const car = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X3',
        year: 2022,
        license_plate: 'GHI789',
        current_mileage: 45000 // 2000 miles from next service
      })
      .returning()
      .execute();

    // Create service schedule due at 47000 miles (beyond 1000 mile threshold)
    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Transmission Service',
        interval_type: 'mileage',
        interval_value: 30000,
        last_service_date: null,
        last_service_mileage: 17000,
        next_service_date: null,
        next_service_mileage: 47000,
        is_active: true
      })
      .execute();

    const result = await getUpcomingServices();
    expect(result).toHaveLength(0);
  });

  it('should not return inactive service schedules', async () => {
    // Create a test car
    const car = await db.insert(carsTable)
      .values({
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2020,
        license_plate: 'JKL012',
        current_mileage: 25000
      })
      .returning()
      .execute();

    // Create inactive service schedule that would otherwise be due
    const nextServiceDate = new Date();
    nextServiceDate.setDate(nextServiceDate.getDate() + 10);

    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Oil Change',
        interval_type: 'time',
        interval_value: 3,
        last_service_date: null,
        last_service_mileage: null,
        next_service_date: nextServiceDate,
        next_service_mileage: null,
        is_active: false // Inactive
      })
      .execute();

    const result = await getUpcomingServices();
    expect(result).toHaveLength(0);
  });

  it('should sort services by urgency with time-based services first', async () => {
    // Create two test cars
    const car1 = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        license_plate: 'MNO345',
        current_mileage: 40000
      })
      .returning()
      .execute();

    const car2 = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        license_plate: 'PQR678',
        current_mileage: 59800
      })
      .returning()
      .execute();

    // Create time-based service due in 25 days
    const laterServiceDate = new Date();
    laterServiceDate.setDate(laterServiceDate.getDate() + 25);

    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car1[0].id,
        service_type: 'Brake Inspection',
        interval_type: 'time',
        interval_value: 12,
        last_service_date: null,
        last_service_mileage: null,
        next_service_date: laterServiceDate,
        next_service_mileage: null,
        is_active: true
      })
      .execute();

    // Create time-based service due in 5 days (more urgent)
    const earlierServiceDate = new Date();
    earlierServiceDate.setDate(earlierServiceDate.getDate() + 5);

    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car2[0].id,
        service_type: 'Oil Change',
        interval_type: 'time',
        interval_value: 3,
        last_service_date: null,
        last_service_mileage: null,
        next_service_date: earlierServiceDate,
        next_service_mileage: null,
        is_active: true
      })
      .execute();

    // Create mileage-based service due soon
    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car2[0].id,
        service_type: 'Tire Rotation',
        interval_type: 'mileage',
        interval_value: 5000,
        last_service_date: null,
        last_service_mileage: 55000,
        next_service_date: null,
        next_service_mileage: 60000, // 200 miles remaining
        is_active: true
      })
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(3);
    // Most urgent time-based service should be first
    expect(result[0].service_type).toBe('Oil Change');
    expect(result[0].next_service_date).toEqual(earlierServiceDate);
    
    // Second time-based service
    expect(result[1].service_type).toBe('Brake Inspection');
    expect(result[1].next_service_date).toEqual(laterServiceDate);
    
    // Mileage-based service should be last
    expect(result[2].service_type).toBe('Tire Rotation');
    expect(result[2].interval_type).toBe('mileage');
  });

  it('should handle mixed time and mileage schedules correctly', async () => {
    // Create a test car
    const car = await db.insert(carsTable)
      .values({
        make: 'Nissan',
        model: 'Altima',
        year: 2019,
        license_plate: 'STU901',
        current_mileage: 49200
      })
      .returning()
      .execute();

    // Create time-based service due in 20 days
    const nextServiceDate = new Date();
    nextServiceDate.setDate(nextServiceDate.getDate() + 20);

    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Annual Inspection',
        interval_type: 'time',
        interval_value: 12,
        last_service_date: null,
        last_service_mileage: null,
        next_service_date: nextServiceDate,
        next_service_mileage: null,
        is_active: true
      })
      .execute();

    // Create mileage-based service due at 50000 miles (800 miles remaining)
    await db.insert(serviceSchedulesTable)
      .values({
        car_id: car[0].id,
        service_type: 'Major Service',
        interval_type: 'mileage',
        interval_value: 10000,
        last_service_date: null,
        last_service_mileage: 40000,
        next_service_date: null,
        next_service_mileage: 50000,
        is_active: true
      })
      .execute();

    const result = await getUpcomingServices();

    expect(result).toHaveLength(2);
    // Should include both time and mileage-based services
    const serviceTypes = result.map(s => s.service_type);
    expect(serviceTypes).toContain('Annual Inspection');
    expect(serviceTypes).toContain('Major Service');
  });
});
