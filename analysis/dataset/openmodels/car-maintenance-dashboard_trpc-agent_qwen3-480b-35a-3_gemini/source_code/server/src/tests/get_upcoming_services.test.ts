import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getUpcomingServices } from '../handlers/get_upcoming_services';

describe('getUpcomingServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return upcoming services for cars with maintenance history', async () => {
    // Create test car
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '12345678901234567',
        current_mileage: 35000
      })
      .returning()
      .execute();

    // Create maintenance entries
    await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        date: new Date('2023-01-15'),
        service_type: 'Oil Change',
        cost: '25.99',
        mileage_at_service: 30000,
        notes: 'Regular oil change'
      })
      .execute();

    const results = await getUpcomingServices();

    expect(results).toBeArray();
    if (results.length > 0) {
      const service = results[0];
      expect(service.car_id).toBe(car.id);
      expect(service.make).toBe('Toyota');
      expect(service.model).toBe('Camry');
      expect(service.vin).toBe('12345678901234567');
      expect(service.service_type).toBe('Oil Change');
      expect(service.next_service_date).toBeInstanceOf(Date);
      expect(typeof service.next_service_mileage).toBe('number');
      expect(service.next_service_mileage).toBeGreaterThan(car.current_mileage);
    }
  });

  it('should return empty array when no cars have maintenance history', async () => {
    // Create test car without maintenance entries
    await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: '76543210987654321',
        current_mileage: 25000
      })
      .execute();

    const results = await getUpcomingServices();

    expect(results).toBeArray();
    expect(results).toHaveLength(0);
  });

  it('should handle multiple cars with maintenance history', async () => {
    // Create first car
    const [car1] = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '12345678901234567',
        current_mileage: 35000
      })
      .returning()
      .execute();

    // Create second car
    const [car2] = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Accord',
        year: 2019,
        vin: '76543210987654321',
        current_mileage: 42000
      })
      .returning()
      .execute();

    // Add maintenance entries for both cars
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car1.id,
          date: new Date('2023-01-15'),
          service_type: 'Oil Change',
          cost: '25.99',
          mileage_at_service: 30000,
          notes: 'Regular oil change'
        },
        {
          car_id: car2.id,
          date: new Date('2023-02-20'),
          service_type: 'Oil Change',
          cost: '27.50',
          mileage_at_service: 40000,
          notes: 'Synthetic oil change'
        }
      ])
      .execute();

    const results = await getUpcomingServices();

    expect(results).toBeArray();
    expect(results.length).toBeGreaterThanOrEqual(2);
    
    // Verify both cars are in the results
    const carIds = results.map(service => service.car_id);
    expect(carIds).toContain(car1.id);
    expect(carIds).toContain(car2.id);
  });
});
