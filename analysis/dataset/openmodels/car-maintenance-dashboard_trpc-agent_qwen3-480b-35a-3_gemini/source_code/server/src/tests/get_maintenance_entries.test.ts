import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { getMaintenanceEntries } from '../handlers/get_maintenance_entries';
import { eq } from 'drizzle-orm';

describe('getMaintenanceEntries', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test cars first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '12345678901234567',
        current_mileage: 15000
      })
      .returning()
      .execute();
    
    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: '76543210987654321',
        current_mileage: 25000
      })
      .returning()
      .execute();
    
    // Create test maintenance entries
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: carResult[0].id,
          date: new Date('2023-01-15'),
          service_type: 'Oil Change',
          cost: '29.99',
          mileage_at_service: 10000,
          notes: 'Regular oil change'
        },
        {
          car_id: carResult[0].id,
          date: new Date('2023-06-20'),
          service_type: 'Tire Rotation',
          cost: '15.50',
          mileage_at_service: 12500,
          notes: null
        },
        {
          car_id: car2Result[0].id,
          date: new Date('2023-03-10'),
          service_type: 'Brake Service',
          cost: '89.99',
          mileage_at_service: 20000,
          notes: 'Front brake pad replacement'
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all maintenance entries when no carId is provided', async () => {
    const result = await getMaintenanceEntries();

    expect(result).toHaveLength(3);
    
    // Check that all entries have the correct fields
    result.forEach(entry => {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('car_id');
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('service_type');
      expect(entry).toHaveProperty('cost');
      expect(entry).toHaveProperty('mileage_at_service');
      expect(entry).toHaveProperty('notes');
      expect(entry).toHaveProperty('created_at');
      expect(entry).toHaveProperty('updated_at');
      
      // Check numeric conversion
      expect(typeof entry.cost).toBe('number');
    });
    
    // Verify the entries are sorted by date
    expect(result[0].service_type).toBe('Oil Change');
    expect(result[1].service_type).toBe('Brake Service');
    expect(result[2].service_type).toBe('Tire Rotation');
  });

  it('should fetch maintenance entries for a specific car when carId is provided', async () => {
    // Get the car ID for Toyota Camry
    const cars = await db.select().from(carsTable).where(eq(carsTable.make, 'Toyota')).execute();
    const toyotaId = cars[0].id;
    
    const result = await getMaintenanceEntries(toyotaId);

    expect(result).toHaveLength(2);
    
    // All entries should be for the specified car
    result.forEach(entry => {
      expect(entry.car_id).toBe(toyotaId);
      expect(typeof entry.cost).toBe('number');
    });
    
    // Check specific data
    const serviceTypes = result.map(entry => entry.service_type);
    expect(serviceTypes).toContain('Oil Change');
    expect(serviceTypes).toContain('Tire Rotation');
  });

  it('should return an empty array when carId has no maintenance entries', async () => {
    // Create a car with no maintenance entries
    const newCarResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'Focus',
        year: 2021,
        vin: '12345678901234568',
        current_mileage: 5000
      })
      .returning()
      .execute();
      
    const result = await getMaintenanceEntries(newCarResult[0].id);
    
    expect(result).toHaveLength(0);
  });

  it('should return an empty array when no maintenance entries exist', async () => {
    // Reset and recreate empty DB
    await resetDB();
    await createDB();
    
    const result = await getMaintenanceEntries();
    
    expect(result).toHaveLength(0);
  });
});
