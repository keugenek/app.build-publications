import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteByIdInput } from '../schema';
import { deleteServiceReminder } from '../handlers/delete_service_reminder';

// Test car data
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: '1HGBH41JXMN109186'
};

// Test service reminder data
const testServiceReminder = {
  due_date: new Date('2024-12-01'),
  service_description: 'Oil change',
  is_completed: false
};

describe('deleteServiceReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing service reminder', async () => {
    // Create a car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    const carId = carResult[0].id;

    // Create a service reminder
    const reminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: carId,
        ...testServiceReminder
      })
      .returning()
      .execute();
    const reminderId = reminderResult[0].id;

    // Test input
    const deleteInput: DeleteByIdInput = {
      id: reminderId
    };

    // Delete the service reminder
    const result = await deleteServiceReminder(deleteInput);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify the reminder no longer exists in the database
    const remainingReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, reminderId))
      .execute();

    expect(remainingReminders).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent service reminder', async () => {
    // Test input with non-existent ID
    const deleteInput: DeleteByIdInput = {
      id: 99999
    };

    // Try to delete non-existent service reminder
    const result = await deleteServiceReminder(deleteInput);

    // Verify the deletion returned false
    expect(result).toBe(false);
  });

  it('should not affect other service reminders when deleting one', async () => {
    // Create a car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    const carId = carResult[0].id;

    // Create multiple service reminders
    const reminder1Result = await db.insert(serviceRemindersTable)
      .values({
        car_id: carId,
        due_date: new Date('2024-12-01'),
        service_description: 'Oil change',
        is_completed: false
      })
      .returning()
      .execute();

    const reminder2Result = await db.insert(serviceRemindersTable)
      .values({
        car_id: carId,
        due_date: new Date('2024-12-15'),
        service_description: 'Tire rotation',
        is_completed: true
      })
      .returning()
      .execute();

    const reminder1Id = reminder1Result[0].id;
    const reminder2Id = reminder2Result[0].id;

    // Delete only the first reminder
    const deleteInput: DeleteByIdInput = {
      id: reminder1Id
    };

    const result = await deleteServiceReminder(deleteInput);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify the first reminder is deleted
    const deletedReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, reminder1Id))
      .execute();
    expect(deletedReminders).toHaveLength(0);

    // Verify the second reminder still exists
    const remainingReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, reminder2Id))
      .execute();
    expect(remainingReminders).toHaveLength(1);
    expect(remainingReminders[0].service_description).toBe('Tire rotation');
  });

  it('should handle deletion of completed service reminders', async () => {
    // Create a car first
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    const carId = carResult[0].id;

    // Create a completed service reminder
    const reminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: carId,
        due_date: new Date('2024-11-01'),
        service_description: 'Brake inspection',
        is_completed: true
      })
      .returning()
      .execute();
    const reminderId = reminderResult[0].id;

    // Test input
    const deleteInput: DeleteByIdInput = {
      id: reminderId
    };

    // Delete the completed service reminder
    const result = await deleteServiceReminder(deleteInput);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify the reminder no longer exists in the database
    const remainingReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, reminderId))
      .execute();

    expect(remainingReminders).toHaveLength(0);
  });
});
