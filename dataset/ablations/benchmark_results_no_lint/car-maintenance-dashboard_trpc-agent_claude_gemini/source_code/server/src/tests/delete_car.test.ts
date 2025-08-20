import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceHistoryTable, serviceRemindersTable } from '../db/schema';
import { type DeleteByIdInput, type CreateCarInput, type CreateMaintenanceHistoryInput, type CreateServiceReminderInput } from '../schema';
import { deleteCar } from '../handlers/delete_car';
import { eq } from 'drizzle-orm';

// Test input
const testCarInput: CreateCarInput = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1234567890ABCDEFG'
};

const deleteInput: DeleteByIdInput = {
  id: 1
};

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a car successfully', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();

    const car = carResult[0];

    // Delete the car
    const result = await deleteCar({ id: car.id });

    expect(result).toBe(true);

    // Verify car is deleted from database
    const carsAfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(carsAfterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent car', async () => {
    const result = await deleteCar(deleteInput);

    expect(result).toBe(false);
  });

  it('should cascade delete maintenance history records', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance history records
    const maintenanceInput: CreateMaintenanceHistoryInput = {
      car_id: car.id,
      service_date: new Date(),
      service_type: 'Oil Change',
      mileage: 25000,
      cost: 45.99,
      notes: 'Regular maintenance'
    };

    await db.insert(maintenanceHistoryTable)
      .values({
        ...maintenanceInput,
        cost: maintenanceInput.cost.toString()
      })
      .execute();

    await db.insert(maintenanceHistoryTable)
      .values({
        ...maintenanceInput,
        service_type: 'Brake Inspection',
        cost: '89.50'
      })
      .execute();

    // Verify maintenance records exist before deletion
    const maintenanceBeforeDelete = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, car.id))
      .execute();

    expect(maintenanceBeforeDelete).toHaveLength(2);

    // Delete the car
    const result = await deleteCar({ id: car.id });

    expect(result).toBe(true);

    // Verify maintenance history records are deleted
    const maintenanceAfterDelete = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, car.id))
      .execute();

    expect(maintenanceAfterDelete).toHaveLength(0);

    // Verify car is deleted
    const carsAfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(carsAfterDelete).toHaveLength(0);
  });

  it('should cascade delete service reminder records', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();

    const car = carResult[0];

    // Create service reminder records
    const reminderInput: CreateServiceReminderInput = {
      car_id: car.id,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      service_description: 'Next oil change',
      is_completed: false
    };

    await db.insert(serviceRemindersTable)
      .values(reminderInput)
      .execute();

    await db.insert(serviceRemindersTable)
      .values({
        ...reminderInput,
        service_description: 'Tire rotation'
      })
      .execute();

    // Verify reminder records exist before deletion
    const remindersBeforeDelete = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(remindersBeforeDelete).toHaveLength(2);

    // Delete the car
    const result = await deleteCar({ id: car.id });

    expect(result).toBe(true);

    // Verify service reminder records are deleted
    const remindersAfterDelete = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(remindersAfterDelete).toHaveLength(0);

    // Verify car is deleted
    const carsAfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(carsAfterDelete).toHaveLength(0);
  });

  it('should cascade delete both maintenance history and service reminders', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();

    const car = carResult[0];

    // Create maintenance history record
    const maintenanceInput: CreateMaintenanceHistoryInput = {
      car_id: car.id,
      service_date: new Date(),
      service_type: 'Oil Change',
      mileage: 25000,
      cost: 45.99,
      notes: 'Regular maintenance'
    };

    await db.insert(maintenanceHistoryTable)
      .values({
        ...maintenanceInput,
        cost: maintenanceInput.cost.toString()
      })
      .execute();

    // Create service reminder record
    const reminderInput: CreateServiceReminderInput = {
      car_id: car.id,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      service_description: 'Next oil change',
      is_completed: false
    };

    await db.insert(serviceRemindersTable)
      .values(reminderInput)
      .execute();

    // Verify both records exist
    const maintenanceBeforeDelete = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, car.id))
      .execute();

    const remindersBeforeDelete = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(maintenanceBeforeDelete).toHaveLength(1);
    expect(remindersBeforeDelete).toHaveLength(1);

    // Delete the car
    const result = await deleteCar({ id: car.id });

    expect(result).toBe(true);

    // Verify all records are deleted
    const maintenanceAfterDelete = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, car.id))
      .execute();

    const remindersAfterDelete = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    const carsAfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car.id))
      .execute();

    expect(maintenanceAfterDelete).toHaveLength(0);
    expect(remindersAfterDelete).toHaveLength(0);
    expect(carsAfterDelete).toHaveLength(0);
  });

  it('should only delete records for specified car ID', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values(testCarInput)
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        ...testCarInput,
        make: 'Honda',
        model: 'Civic',
        vin: 'DIFFERENT123456789'
      })
      .returning()
      .execute();

    const car1 = car1Result[0];
    const car2 = car2Result[0];

    // Create maintenance records for both cars
    await db.insert(maintenanceHistoryTable)
      .values({
        car_id: car1.id,
        service_date: new Date(),
        service_type: 'Oil Change Car 1',
        mileage: 25000,
        cost: '45.99',
        notes: 'Car 1 maintenance'
      })
      .execute();

    await db.insert(maintenanceHistoryTable)
      .values({
        car_id: car2.id,
        service_date: new Date(),
        service_type: 'Oil Change Car 2',
        mileage: 30000,
        cost: '55.99',
        notes: 'Car 2 maintenance'
      })
      .execute();

    // Delete only car1
    const result = await deleteCar({ id: car1.id });

    expect(result).toBe(true);

    // Verify car1 and its maintenance are deleted
    const car1AfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car1.id))
      .execute();

    const car1MaintenanceAfterDelete = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, car1.id))
      .execute();

    expect(car1AfterDelete).toHaveLength(0);
    expect(car1MaintenanceAfterDelete).toHaveLength(0);

    // Verify car2 and its maintenance still exist
    const car2AfterDelete = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car2.id))
      .execute();

    const car2MaintenanceAfterDelete = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, car2.id))
      .execute();

    expect(car2AfterDelete).toHaveLength(1);
    expect(car2MaintenanceAfterDelete).toHaveLength(1);
    expect(car2MaintenanceAfterDelete[0].service_type).toBe('Oil Change Car 2');
  });
});
