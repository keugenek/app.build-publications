import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable, serviceSchedulesTable } from '../db/schema';
import { type DeleteCarInput } from '../schema';
import { deleteCar } from '../handlers/delete_car';
import { eq } from 'drizzle-orm';

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a car successfully', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        current_mileage: 15000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;
    const input: DeleteCarInput = { id: carId };

    // Delete the car
    const result = await deleteCar(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify car is actually deleted from database
    const deletedCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    expect(deletedCar).toHaveLength(0);
  });

  it('should delete car and all related maintenance entries', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789',
        current_mileage: 25000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance entries for the car
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: carId,
          service_date: new Date('2023-06-01'),
          service_type: 'Oil Change',
          description: 'Regular oil change',
          cost: '50.00',
          mileage_at_service: 24000
        },
        {
          car_id: carId,
          service_date: new Date('2023-08-01'),
          service_type: 'Tire Rotation',
          description: 'Tire rotation service',
          cost: '30.00',
          mileage_at_service: 24500
        }
      ])
      .execute();

    // Verify maintenance entries exist before deletion
    const maintenanceEntriesBeforeDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, carId))
      .execute();

    expect(maintenanceEntriesBeforeDelete).toHaveLength(2);

    const input: DeleteCarInput = { id: carId };

    // Delete the car
    const result = await deleteCar(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify car is deleted
    const deletedCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    expect(deletedCar).toHaveLength(0);

    // Verify maintenance entries are also deleted (cascade delete)
    const maintenanceEntriesAfterDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, carId))
      .execute();

    expect(maintenanceEntriesAfterDelete).toHaveLength(0);
  });

  it('should delete car and all related service schedules', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        license_plate: 'DEF456',
        current_mileage: 10000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create service schedules for the car
    await db.insert(serviceSchedulesTable)
      .values([
        {
          car_id: carId,
          service_type: 'Oil Change',
          interval_type: 'mileage',
          interval_value: 5000,
          last_service_date: new Date('2023-01-01'),
          last_service_mileage: 5000,
          next_service_date: new Date('2023-07-01'),
          next_service_mileage: 10000,
          is_active: true
        },
        {
          car_id: carId,
          service_type: 'Annual Inspection',
          interval_type: 'time',
          interval_value: 12,
          last_service_date: new Date('2023-01-01'),
          last_service_mileage: null,
          next_service_date: new Date('2024-01-01'),
          next_service_mileage: null,
          is_active: true
        }
      ])
      .execute();

    // Verify service schedules exist before deletion
    const serviceSchedulesBeforeDelete = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.car_id, carId))
      .execute();

    expect(serviceSchedulesBeforeDelete).toHaveLength(2);

    const input: DeleteCarInput = { id: carId };

    // Delete the car
    const result = await deleteCar(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify car is deleted
    const deletedCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    expect(deletedCar).toHaveLength(0);

    // Verify service schedules are also deleted (cascade delete)
    const serviceSchedulesAfterDelete = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.car_id, carId))
      .execute();

    expect(serviceSchedulesAfterDelete).toHaveLength(0);
  });

  it('should delete car with all related data (maintenance entries and service schedules)', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2018,
        license_plate: 'GHI123',
        current_mileage: 35000
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create maintenance entries
    await db.insert(maintenanceEntriesTable)
      .values({
        car_id: carId,
        service_date: new Date('2023-05-15'),
        service_type: 'Brake Service',
        description: 'Front brake pad replacement',
        cost: '200.00',
        mileage_at_service: 34000
      })
      .execute();

    // Create service schedules
    await db.insert(serviceSchedulesTable)
      .values({
        car_id: carId,
        service_type: 'Brake Inspection',
        interval_type: 'mileage',
        interval_value: 15000,
        last_service_date: new Date('2023-05-15'),
        last_service_mileage: 34000,
        next_service_date: null,
        next_service_mileage: 49000,
        is_active: true
      })
      .execute();

    // Verify all data exists before deletion
    const carBeforeDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();
    const maintenanceBeforeDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, carId))
      .execute();
    const schedulesBeforeDelete = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.car_id, carId))
      .execute();

    expect(carBeforeDelete).toHaveLength(1);
    expect(maintenanceBeforeDelete).toHaveLength(1);
    expect(schedulesBeforeDelete).toHaveLength(1);

    const input: DeleteCarInput = { id: carId };

    // Delete the car
    const result = await deleteCar(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify all data is deleted
    const carAfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();
    const maintenanceAfterDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, carId))
      .execute();
    const schedulesAfterDelete = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.car_id, carId))
      .execute();

    expect(carAfterDelete).toHaveLength(0);
    expect(maintenanceAfterDelete).toHaveLength(0);
    expect(schedulesAfterDelete).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent car', async () => {
    const input: DeleteCarInput = { id: 99999 };

    // Attempt to delete non-existent car
    await expect(deleteCar(input)).rejects.toThrow(/Car with id 99999 not found/);
  });

  it('should not affect other cars when deleting one car', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Prius',
        year: 2022,
        license_plate: 'ECO123',
        current_mileage: 5000
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X3',
        year: 2020,
        license_plate: 'LUX456',
        current_mileage: 20000
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
          service_date: new Date('2023-06-01'),
          service_type: 'Oil Change',
          description: 'Hybrid oil change',
          cost: '45.00',
          mileage_at_service: 4800
        },
        {
          car_id: car2Id,
          service_date: new Date('2023-06-01'),
          service_type: 'Oil Change',
          description: 'Premium oil change',
          cost: '80.00',
          mileage_at_service: 19500
        }
      ])
      .execute();

    const input: DeleteCarInput = { id: car1Id };

    // Delete the first car
    const result = await deleteCar(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify first car is deleted
    const car1AfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car1Id))
      .execute();

    expect(car1AfterDelete).toHaveLength(0);

    // Verify second car still exists
    const car2AfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car2Id))
      .execute();

    expect(car2AfterDelete).toHaveLength(1);
    expect(car2AfterDelete[0].make).toBe('BMW');

    // Verify maintenance entries for first car are deleted
    const car1MaintenanceAfterDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car1Id))
      .execute();

    expect(car1MaintenanceAfterDelete).toHaveLength(0);

    // Verify maintenance entries for second car still exist
    const car2MaintenanceAfterDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car2Id))
      .execute();

    expect(car2MaintenanceAfterDelete).toHaveLength(1);
    expect(car2MaintenanceAfterDelete[0].service_type).toBe('Oil Change');
  });
});
