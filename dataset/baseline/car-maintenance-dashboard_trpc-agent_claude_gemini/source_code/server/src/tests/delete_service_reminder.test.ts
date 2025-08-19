import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { deleteServiceReminder } from '../handlers/delete_service_reminder';
import { eq } from 'drizzle-orm';

describe('deleteServiceReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing service reminder', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create a test service reminder
    const reminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: carId,
        service_type: 'oil_change',
        reminder_type: 'date_based',
        due_date: new Date('2024-06-01'),
        due_mileage: null,
        is_completed: false,
        notes: 'Test reminder'
      })
      .returning()
      .execute();

    const reminderId = reminderResult[0].id;

    // Delete the service reminder
    const result = await deleteServiceReminder(reminderId);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the record was actually deleted from database
    const deletedReminder = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, reminderId))
      .execute();

    expect(deletedReminder).toHaveLength(0);
  });

  it('should return false for non-existent service reminder', async () => {
    // Attempt to delete a non-existent reminder
    const result = await deleteServiceReminder(99999);

    // Verify the result
    expect(result.success).toBe(false);
  });

  it('should handle deletion of mileage-based reminder', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create a mileage-based service reminder
    const reminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: carId,
        service_type: 'tire_rotation',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 75000,
        is_completed: true,
        notes: 'Mileage-based reminder'
      })
      .returning()
      .execute();

    const reminderId = reminderResult[0].id;

    // Delete the service reminder
    const result = await deleteServiceReminder(reminderId);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the record was actually deleted from database
    const deletedReminder = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, reminderId))
      .execute();

    expect(deletedReminder).toHaveLength(0);
  });

  it('should only delete the specified reminder', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2019,
        license_plate: 'TRUCK1'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create multiple service reminders
    const reminderResults = await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          service_type: 'oil_change',
          reminder_type: 'date_based',
          due_date: new Date('2024-06-01'),
          due_mileage: null,
          is_completed: false,
          notes: 'First reminder'
        },
        {
          car_id: carId,
          service_type: 'brake_service',
          reminder_type: 'mileage_based',
          due_date: null,
          due_mileage: 80000,
          is_completed: false,
          notes: 'Second reminder'
        }
      ])
      .returning()
      .execute();

    const firstReminderId = reminderResults[0].id;
    const secondReminderId = reminderResults[1].id;

    // Delete only the first reminder
    const result = await deleteServiceReminder(firstReminderId);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify only the first reminder was deleted
    const remainingReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, carId))
      .execute();

    expect(remainingReminders).toHaveLength(1);
    expect(remainingReminders[0].id).toBe(secondReminderId);
    expect(remainingReminders[0].notes).toBe('Second reminder');
  });

  it('should handle deletion with different service types', async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X5',
        year: 2022,
        license_plate: 'BMW123'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create service reminders with different service types
    const serviceTypes = ['transmission_service', 'engine_tune_up', 'inspection', 'other'];
    
    for (const serviceType of serviceTypes) {
      const reminderResult = await db.insert(serviceRemindersTable)
        .values({
          car_id: carId,
          service_type: serviceType as any,
          reminder_type: 'date_based',
          due_date: new Date('2024-07-01'),
          due_mileage: null,
          is_completed: false,
          notes: `${serviceType} reminder`
        })
        .returning()
        .execute();

      const reminderId = reminderResult[0].id;

      // Delete the service reminder
      const result = await deleteServiceReminder(reminderId);
      expect(result.success).toBe(true);

      // Verify deletion
      const deletedReminder = await db.select()
        .from(serviceRemindersTable)
        .where(eq(serviceRemindersTable.id, reminderId))
        .execute();

      expect(deletedReminder).toHaveLength(0);
    }
  });
});
