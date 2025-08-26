import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceEntriesTable, serviceRemindersTable } from '../db/schema';
import { deleteCar } from '../handlers/delete_car';
import { eq } from 'drizzle-orm';

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing car', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Delete the car
    const result = await deleteCar(car.id);

    // Should return success
    expect(result.success).toBe(true);

    // Verify car is deleted from database
    const remainingCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(remainingCars).toHaveLength(0);
  });

  it('should return false when deleting non-existent car', async () => {
    // Try to delete a car that doesn't exist
    const result = await deleteCar(999);

    // Should return success false
    expect(result.success).toBe(false);
  });

  it('should cascade delete related maintenance entries', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create related maintenance entries
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car.id,
          service_date: new Date('2023-01-15'),
          mileage: 25000,
          service_type: 'oil_change',
          cost: '45.99',
          notes: 'Regular oil change'
        },
        {
          car_id: car.id,
          service_date: new Date('2023-03-20'),
          mileage: 27000,
          service_type: 'tire_rotation',
          cost: '25.00',
          notes: 'Tire rotation service'
        }
      ])
      .execute();

    // Verify maintenance entries exist before deletion
    const maintenanceEntriesBeforeDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car.id))
      .execute();

    expect(maintenanceEntriesBeforeDelete).toHaveLength(2);

    // Delete the car
    const result = await deleteCar(car.id);

    // Should return success
    expect(result.success).toBe(true);

    // Verify maintenance entries are cascade deleted
    const maintenanceEntriesAfterDelete = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car.id))
      .execute();

    expect(maintenanceEntriesAfterDelete).toHaveLength(0);
  });

  it('should cascade delete related service reminders', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        license_plate: 'DEF456'
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create related service reminders
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: car.id,
          service_type: 'oil_change',
          reminder_type: 'mileage_based',
          due_date: null,
          due_mileage: 30000,
          notes: 'Next oil change due'
        },
        {
          car_id: car.id,
          service_type: 'inspection',
          reminder_type: 'date_based',
          due_date: new Date('2024-06-01'),
          due_mileage: null,
          notes: 'Annual inspection'
        }
      ])
      .execute();

    // Verify service reminders exist before deletion
    const serviceRemindersBeforeDelete = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(serviceRemindersBeforeDelete).toHaveLength(2);

    // Delete the car
    const result = await deleteCar(car.id);

    // Should return success
    expect(result.success).toBe(true);

    // Verify service reminders are cascade deleted
    const serviceRemindersAfterDelete = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(serviceRemindersAfterDelete).toHaveLength(0);
  });

  it('should cascade delete both maintenance entries and service reminders', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: '3 Series',
        year: 2022,
        license_plate: 'GHI789'
      })
      .returning()
      .execute();

    const car = carResult[0];

    // Create both maintenance entries and service reminders
    await db.insert(maintenanceEntriesTable)
      .values({
        car_id: car.id,
        service_date: new Date('2023-05-10'),
        mileage: 15000,
        service_type: 'brake_service',
        cost: '120.50',
        notes: 'Brake pad replacement'
      })
      .execute();

    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'transmission_service',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 50000,
        notes: 'Transmission service reminder'
      })
      .execute();

    // Verify both types of records exist
    const maintenanceEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car.id))
      .execute();

    const serviceReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(maintenanceEntries).toHaveLength(1);
    expect(serviceReminders).toHaveLength(1);

    // Delete the car
    const result = await deleteCar(car.id);

    // Should return success
    expect(result.success).toBe(true);

    // Verify both types of records are cascade deleted
    const remainingMaintenanceEntries = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car.id))
      .execute();

    const remainingServiceReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(remainingMaintenanceEntries).toHaveLength(0);
    expect(remainingServiceReminders).toHaveLength(0);

    // Verify car itself is deleted
    const remainingCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(remainingCars).toHaveLength(0);
  });

  it('should not affect other cars when deleting one car', async () => {
    // Create two test cars
    const carsResult = await db.insert(carsTable)
      .values([
        {
          make: 'Chevrolet',
          model: 'Malibu',
          year: 2020,
          license_plate: 'JKL012'
        },
        {
          make: 'Nissan',
          model: 'Altima',
          year: 2021,
          license_plate: 'MNO345'
        }
      ])
      .returning()
      .execute();

    const car1 = carsResult[0];
    const car2 = carsResult[1];

    // Create maintenance entries for both cars
    await db.insert(maintenanceEntriesTable)
      .values([
        {
          car_id: car1.id,
          service_date: new Date('2023-02-15'),
          mileage: 20000,
          service_type: 'oil_change',
          cost: '35.99',
          notes: 'Car 1 oil change'
        },
        {
          car_id: car2.id,
          service_date: new Date('2023-02-20'),
          mileage: 18000,
          service_type: 'oil_change',
          cost: '35.99',
          notes: 'Car 2 oil change'
        }
      ])
      .execute();

    // Delete only the first car
    const result = await deleteCar(car1.id);

    // Should return success
    expect(result.success).toBe(true);

    // Verify first car and its maintenance entries are deleted
    const remainingCar1 = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car1.id))
      .execute();

    const remainingCar1Maintenance = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car1.id))
      .execute();

    expect(remainingCar1).toHaveLength(0);
    expect(remainingCar1Maintenance).toHaveLength(0);

    // Verify second car and its maintenance entries still exist
    const remainingCar2 = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car2.id))
      .execute();

    const remainingCar2Maintenance = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, car2.id))
      .execute();

    expect(remainingCar2).toHaveLength(1);
    expect(remainingCar2Maintenance).toHaveLength(1);
    expect(remainingCar2[0].make).toEqual('Nissan');
    expect(remainingCar2Maintenance[0].notes).toEqual('Car 2 oil change');
  });
});
