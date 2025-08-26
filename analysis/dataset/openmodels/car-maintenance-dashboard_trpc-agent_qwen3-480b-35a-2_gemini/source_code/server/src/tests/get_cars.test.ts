import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { getCars } from '../handlers/get_cars';
import { eq } from 'drizzle-orm';

describe('getCars', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no cars exist', async () => {
    const result = await getCars();
    expect(result).toEqual([]);
  });

  it('should return all cars when cars exist', async () => {
    // Insert test cars
    const car1 = {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      licensePlate: 'ABC123',
      vin: '1HGBH41JXMN109186',
      nextServiceDate: '2023-12-01',
      nextServiceMileage: 30000
    };

    const car2 = {
      make: 'Honda',
      model: 'Civic',
      year: 2021,
      licensePlate: 'XYZ789',
      vin: '2HGFC2F59MH109356',
      nextServiceDate: '2024-01-15',
      nextServiceMileage: 25000
    };

    // Insert cars into database
    await db.insert(carsTable).values(car1).execute();
    await db.insert(carsTable).values(car2).execute();

    // Fetch cars
    const result = await getCars();

    // Validate results
    expect(result).toHaveLength(2);
    
    const fetchedCar1 = result.find(car => car.licensePlate === 'ABC123');
    const fetchedCar2 = result.find(car => car.licensePlate === 'XYZ789');
    
    expect(fetchedCar1).toBeDefined();
    expect(fetchedCar1?.make).toEqual('Toyota');
    expect(fetchedCar1?.model).toEqual('Camry');
    expect(fetchedCar1?.year).toEqual(2020);
    expect(fetchedCar1?.vin).toEqual('1HGBH41JXMN109186');
    expect(fetchedCar1?.nextServiceDate).toEqual(new Date('2023-12-01'));
    expect(fetchedCar1?.nextServiceMileage).toEqual(30000);
    expect(fetchedCar1?.created_at).toBeInstanceOf(Date);
    
    expect(fetchedCar2).toBeDefined();
    expect(fetchedCar2?.make).toEqual('Honda');
    expect(fetchedCar2?.model).toEqual('Civic');
    expect(fetchedCar2?.year).toEqual(2021);
    expect(fetchedCar2?.vin).toEqual('2HGFC2F59MH109356');
    expect(fetchedCar2?.nextServiceDate).toEqual(new Date('2024-01-15'));
    expect(fetchedCar2?.nextServiceMileage).toEqual(25000);
    expect(fetchedCar2?.created_at).toBeInstanceOf(Date);
  });

  it('should handle cars with null optional fields', async () => {
    // Insert a car with null optional fields
    const carWithNulls = {
      make: 'Ford',
      model: 'Focus',
      year: 2019,
      licensePlate: 'NULL123',
      vin: '3FADP3F3XKM123456',
      nextServiceDate: null,
      nextServiceMileage: null
    };

    await db.insert(carsTable).values(carWithNulls).execute();

    const result = await getCars();
    
    expect(result).toHaveLength(1);
    expect(result[0].nextServiceDate).toBeNull();
    expect(result[0].nextServiceMileage).toBeNull();
  });
});
