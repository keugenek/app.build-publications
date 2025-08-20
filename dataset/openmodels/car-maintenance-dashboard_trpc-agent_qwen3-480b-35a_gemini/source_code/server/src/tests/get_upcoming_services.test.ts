import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, upcomingServicesTable } from '../db/schema';
import { getUpcomingServices } from '../handlers/get_upcoming_services';
import { eq } from 'drizzle-orm';

describe('getUpcomingServices', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        vin: '1234567890'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;
    
    // Create test upcoming services for this car
    await db.insert(upcomingServicesTable)
      .values({
        car_id: carId,
        service_type: 'Oil Change',
        due_date: '2023-12-01',
        due_mileage: 15000,
        notes: 'Synthetic oil required'
      })
      .execute();
      
    await db.insert(upcomingServicesTable)
      .values({
        car_id: carId,
        service_type: 'Tire Rotation',
        due_date: '2024-01-15',
        due_mileage: 20000,
        notes: null
      })
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all upcoming services for a specific car', async () => {
    // First get the car ID from database
    const cars = await db.select().from(carsTable).execute();
    const carId = cars[0].id;
    
    const result = await getUpcomingServices(carId);

    expect(result).toHaveLength(2);
    
    // Check the first service
    const oilChangeService = result.find(s => s.service_type === 'Oil Change');
    expect(oilChangeService).toBeDefined();
    expect(oilChangeService!.car_id).toBe(carId);
    expect(oilChangeService!.service_type).toBe('Oil Change');
    expect(oilChangeService!.due_date).toEqual(new Date('2023-12-01'));
    expect(oilChangeService!.due_mileage).toBe(15000);
    expect(oilChangeService!.notes).toBe('Synthetic oil required');
    expect(oilChangeService!.created_at).toBeInstanceOf(Date);
    
    // Check the second service
    const tireRotationService = result.find(s => s.service_type === 'Tire Rotation');
    expect(tireRotationService).toBeDefined();
    expect(tireRotationService!.car_id).toBe(carId);
    expect(tireRotationService!.service_type).toBe('Tire Rotation');
    expect(tireRotationService!.due_date).toEqual(new Date('2024-01-15'));
    expect(tireRotationService!.due_mileage).toBe(20000);
    expect(tireRotationService!.notes).toBeNull();
    expect(tireRotationService!.created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array if no upcoming services exist for the car', async () => {
    // Create a car with no upcoming services
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        license_plate: 'XYZ789',
        vin: '0987654321'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;
    const result = await getUpcomingServices(carId);
    
    expect(result).toHaveLength(0);
  });

  it('should handle non-existent car ID gracefully', async () => {
    // Try to fetch upcoming services for a non-existent car
    const result = await getUpcomingServices(99999);
    
    expect(result).toHaveLength(0);
  });
});
