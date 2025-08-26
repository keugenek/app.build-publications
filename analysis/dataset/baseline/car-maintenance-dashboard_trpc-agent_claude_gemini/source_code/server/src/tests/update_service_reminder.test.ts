import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { type UpdateServiceReminderInput, type ServiceType } from '../schema';
import { updateServiceReminder } from '../handlers/update_service_reminder';
import { eq } from 'drizzle-orm';

describe('updateServiceReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCarId: number;
  let testReminderId: number;

  beforeEach(async () => {
    // Create a test car first
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2020,
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    testCarId = carResult[0].id;

    // Create a test service reminder
    const reminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: testCarId,
        service_type: 'oil_change',
        reminder_type: 'date_based',
        due_date: new Date('2024-06-15'),
        due_mileage: null,
        is_completed: false,
        notes: 'Original notes'
      })
      .returning()
      .execute();

    testReminderId = reminderResult[0].id;
  });

  it('should update service reminder fields', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      service_type: 'brake_service',
      is_completed: true,
      notes: 'Updated notes'
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.id).toEqual(testReminderId);
    expect(result.car_id).toEqual(testCarId);
    expect(result.service_type).toEqual('brake_service');
    expect(result.reminder_type).toEqual('date_based'); // Unchanged
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_mileage).toBeNull();
    expect(result.is_completed).toEqual(true);
    expect(result.notes).toEqual('Updated notes');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      is_completed: true
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.service_type).toEqual('oil_change'); // Unchanged
    expect(result.reminder_type).toEqual('date_based'); // Unchanged
    expect(result.is_completed).toEqual(true); // Updated
    expect(result.notes).toEqual('Original notes'); // Unchanged
  });

  it('should update reminder type and related fields', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      reminder_type: 'mileage_based',
      due_date: null,
      due_mileage: 50000
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.reminder_type).toEqual('mileage_based');
    expect(result.due_date).toBeNull();
    expect(result.due_mileage).toEqual(50000);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      service_type: 'transmission_service',
      is_completed: true,
      notes: 'Completed service'
    };

    await updateServiceReminder(updateInput);

    // Query the database to verify changes were saved
    const reminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, testReminderId))
      .execute();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].service_type).toEqual('transmission_service');
    expect(reminders[0].is_completed).toEqual(true);
    expect(reminders[0].notes).toEqual('Completed service');
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      notes: null,
      due_date: null
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.notes).toBeNull();
    expect(result.due_date).toBeNull();
  });

  it('should throw error for non-existent reminder', async () => {
    const updateInput: UpdateServiceReminderInput = {
      id: 99999, // Non-existent ID
      is_completed: true
    };

    expect(updateServiceReminder(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle date updates correctly', async () => {
    const newDueDate = new Date('2024-12-31');
    const updateInput: UpdateServiceReminderInput = {
      id: testReminderId,
      due_date: newDueDate
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString()).toEqual(newDueDate.toISOString());
  });

  it('should update all service types correctly', async () => {
    const serviceTypes: ServiceType[] = [
      'tire_rotation',
      'brake_service',
      'transmission_service',
      'engine_tune_up',
      'air_filter_replacement',
      'battery_replacement',
      'coolant_service',
      'inspection',
      'other'
    ];

    for (const serviceType of serviceTypes) {
      const updateInput: UpdateServiceReminderInput = {
        id: testReminderId,
        service_type: serviceType
      };

      const result = await updateServiceReminder(updateInput);
      expect(result.service_type).toEqual(serviceType);
    }
  });

  it('should update mileage-based reminder correctly', async () => {
    // First create a mileage-based reminder
    const mileageReminderResult = await db.insert(serviceRemindersTable)
      .values({
        car_id: testCarId,
        service_type: 'tire_rotation',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 30000,
        is_completed: false,
        notes: null
      })
      .returning()
      .execute();

    const mileageReminderId = mileageReminderResult[0].id;

    const updateInput: UpdateServiceReminderInput = {
      id: mileageReminderId,
      due_mileage: 35000,
      is_completed: true,
      notes: 'Rescheduled for higher mileage'
    };

    const result = await updateServiceReminder(updateInput);

    expect(result.reminder_type).toEqual('mileage_based');
    expect(result.due_date).toBeNull();
    expect(result.due_mileage).toEqual(35000);
    expect(result.is_completed).toEqual(true);
    expect(result.notes).toEqual('Rescheduled for higher mileage');
  });
});
