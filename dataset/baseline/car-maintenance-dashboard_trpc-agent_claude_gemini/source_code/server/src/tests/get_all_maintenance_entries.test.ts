import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable } from '../db/schema';
import { getAllMaintenanceEntries } from '../handlers/get_all_maintenance_entries';

describe('getAllMaintenanceEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no maintenance entries exist', async () => {
    const result = await getAllMaintenanceEntries();
    
    expect(result).toEqual([]);
  });

  it('should return all maintenance entries', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC-123'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create test maintenance entries
    const testEntries = [
      {
        car_id: carId,
        service_date: new Date('2024-01-15'),
        mileage: 25000,
        service_type: 'oil_change' as const,
        cost: '50.99',
        notes: 'Regular oil change'
      },
      {
        car_id: carId,
        service_date: new Date('2024-02-20'),
        mileage: 26000,
        service_type: 'tire_rotation' as const,
        cost: '25.00',
        notes: null
      }
    ];

    await db.insert(maintenanceEntriesTable)
      .values(testEntries)
      .execute();

    const result = await getAllMaintenanceEntries();

    expect(result).toHaveLength(2);
    
    // Verify first entry
    const firstEntry = result.find(e => e.service_type === 'oil_change');
    expect(firstEntry).toBeDefined();
    expect(firstEntry!.car_id).toEqual(carId);
    expect(firstEntry!.service_date).toBeInstanceOf(Date);
    expect(firstEntry!.mileage).toEqual(25000);
    expect(firstEntry!.service_type).toEqual('oil_change');
    expect(firstEntry!.cost).toEqual(50.99);
    expect(typeof firstEntry!.cost).toEqual('number');
    expect(firstEntry!.notes).toEqual('Regular oil change');
    expect(firstEntry!.created_at).toBeInstanceOf(Date);
    expect(firstEntry!.id).toBeDefined();

    // Verify second entry
    const secondEntry = result.find(e => e.service_type === 'tire_rotation');
    expect(secondEntry).toBeDefined();
    expect(secondEntry!.car_id).toEqual(carId);
    expect(secondEntry!.service_date).toBeInstanceOf(Date);
    expect(secondEntry!.mileage).toEqual(26000);
    expect(secondEntry!.service_type).toEqual('tire_rotation');
    expect(secondEntry!.cost).toEqual(25.00);
    expect(typeof secondEntry!.cost).toEqual('number');
    expect(secondEntry!.notes).toBeNull();
    expect(secondEntry!.created_at).toBeInstanceOf(Date);
    expect(secondEntry!.id).toBeDefined();
  });

  it('should return entries for multiple cars', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC-123'
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ-789'
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create maintenance entries for both cars
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car1Id,
          service_date: new Date('2024-01-15'),
          mileage: 25000,
          service_type: 'oil_change',
          cost: '50.99',
          notes: 'Toyota service'
        },
        {
          car_id: car2Id,
          service_date: new Date('2024-02-10'),
          mileage: 30000,
          service_type: 'brake_service',
          cost: '150.00',
          notes: 'Honda service'
        }
      ])
      .execute();

    const result = await getAllMaintenanceEntries();

    expect(result).toHaveLength(2);
    
    const toyotaEntry = result.find(e => e.car_id === car1Id);
    const hondaEntry = result.find(e => e.car_id === car2Id);
    
    expect(toyotaEntry).toBeDefined();
    expect(toyotaEntry!.service_type).toEqual('oil_change');
    expect(toyotaEntry!.notes).toEqual('Toyota service');
    
    expect(hondaEntry).toBeDefined();
    expect(hondaEntry!.service_type).toEqual('brake_service');
    expect(hondaEntry!.notes).toEqual('Honda service');
  });

  it('should handle all service types correctly', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        license_plate: 'DEF-456'
      })
      .returning()
      .execute();
    
    const carId = carResult[0].id;

    // Create entries with different service types
    const serviceTypes = ['oil_change', 'tire_rotation', 'brake_service', 'inspection'] as const;
    
    for (let i = 0; i < serviceTypes.length; i++) {
      await db.insert(maintenanceEntriesTable)
        .values({
          car_id: carId,
          service_date: new Date(`2024-0${i + 1}-15`),
          mileage: 20000 + (i * 1000),
          service_type: serviceTypes[i],
          cost: (50 + (i * 25)).toString(),
          notes: `${serviceTypes[i]} service`
        })
        .execute();
    }

    const result = await getAllMaintenanceEntries();

    expect(result).toHaveLength(4);
    
    serviceTypes.forEach((serviceType, index) => {
      const entry = result.find(e => e.service_type === serviceType);
      expect(entry).toBeDefined();
      expect(entry!.mileage).toEqual(20000 + (index * 1000));
      expect(entry!.cost).toEqual(50 + (index * 25));
      expect(typeof entry!.cost).toEqual('number');
    });
  });
});
