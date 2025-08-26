import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { type UpdateServiceReminderInput } from '../schema';
import { updateServiceReminder } from '../handlers/update_service_reminder';
import { eq } from 'drizzle-orm';

describe('updateServiceReminder', () => {
  let testCarId: number;
  let testReminderId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186'
      })
      .returning()
      .execute();

    testCarId = carResult[0].id;

    // Create a test service reminder
    const reminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: testCarId,
        due_date: new Date('2024-03-15'),
        service_description: 'Oil Change',
        is_completed: false
      })
      .returning()
      .execute();

    testReminderId = reminderResult[0].id;
  });

  afterEach(resetDB);

  it('should update service reminder due date', async () => {
    const newDueDate = new Date('2024-04-15');
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      due_date: newDueDate
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.id).toEqual(testReminderId);
    expect(result.car_id).toEqual(testCarId);
    expect(result.due_date).toEqual(newDueDate);
    expect(result.service_description).toEqual('Oil Change');
    expect(result.is_completed).toEqual(false);
  });

  it('should update service reminder description', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      service_description: 'Tire Rotation'
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.id).toEqual(testReminderId);
    expect(result.service_description).toEqual('Tire Rotation');
    expect(result.due_date).toEqual(new Date('2024-03-15'));
    expect(result.is_completed).toEqual(false);
  });

  it('should mark service reminder as completed', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      is_completed: true
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.id).toEqual(testReminderId);
    expect(result.is_completed).toEqual(true);
    expect(result.service_description).toEqual('Oil Change');
    expect(result.due_date).toEqual(new Date('2024-03-15'));
  });

  it('should update multiple fields at once', async () => {
    const newDueDate = new Date('2024-05-01');
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      due_date: newDueDate,
      service_description: 'Brake Inspection',
      is_completed: true
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.id).toEqual(testReminderId);
    expect(result.due_date).toEqual(newDueDate);
    expect(result.service_description).toEqual('Brake Inspection');
    expect(result.is_completed).toEqual(true);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      service_description: 'Air Filter Replacement',
      is_completed: true
    };

    await updateServiceReminder(updateInput);

    // Verify changes were saved to database
    const reminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, testReminderId))
      .execute();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].service_description).toEqual('Air Filter Replacement');
    expect(reminders[0].is_completed).toEqual(true);
    expect(reminders[0].car_id).toEqual(testCarId);
  });

  it('should throw error when service reminder not found', async () => {
    const nonExistentId = 99999;
    const updateInput: UpdateServiceReminderInput = {
      id: nonExistentId,
      is_completed: true
    };

    await expect(updateServiceReminder(updateInput)).rejects.toThrow(
      /service reminder with id.*not found/i
    );
  });

  it('should handle partial updates without affecting other fields', async () => {
    // First, let's update one field
    const firstUpdate: UpdateServiceReminderInput = {
      id: testReminderId,
      is_completed: true
    };

    await updateServiceReminder(firstUpdate);

    // Then update a different field
    const secondUpdate: UpdateServiceReminderInput = {
      id: testReminderId,
      service_description: 'Transmission Service'
    };

    const result = await updateServiceReminder(secondUpdate);

    // Verify both updates are preserved
    expect(result.is_completed).toEqual(true); // From first update
    expect(result.service_description).toEqual('Transmission Service'); // From second update
    expect(result.due_date).toEqual(new Date('2024-03-15')); // Original value preserved
  });

  it('should handle updating completed status back to false', async () => {
    // First mark as completed
    await updateServiceReminder({
      id: testReminderId,
      is_completed: true
    });

    // Then mark as not completed
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      is_completed: false
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.is_completed).toEqual(false);
  });
});
