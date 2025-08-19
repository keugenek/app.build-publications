import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { getUpcomingServiceReminders } from '../handlers/get_upcoming_service_reminders';

describe('getUpcomingServiceReminders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no reminders exist', async () => {
    const result = await getUpcomingServiceReminders();
    expect(result).toEqual([]);
  });

  it('should return only non-completed reminders', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'TEST123'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create a completed reminder
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'oil_change',
        reminder_type: 'date_based',
        due_date: new Date('2024-01-15'),
        due_mileage: null,
        is_completed: true,
        notes: 'Already done'
      })
      .execute();

    // Create a non-completed reminder
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'tire_rotation',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 50000,
        is_completed: false,
        notes: 'Upcoming service'
      })
      .execute();

    const result = await getUpcomingServiceReminders();

    expect(result).toHaveLength(1);
    expect(result[0].service_type).toEqual('tire_rotation');
    expect(result[0].is_completed).toEqual(false);
    expect(result[0].due_mileage).toEqual(50000);
    expect(result[0].notes).toEqual('Upcoming service');
  });

  it('should order reminders by due date first', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'TEST456'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create date-based reminders in reverse chronological order
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'brake_service',
        reminder_type: 'date_based',
        due_date: new Date('2024-03-01'),
        due_mileage: null,
        is_completed: false,
        notes: 'Later reminder'
      })
      .execute();

    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'oil_change',
        reminder_type: 'date_based',
        due_date: new Date('2024-01-15'),
        due_mileage: null,
        is_completed: false,
        notes: 'Earlier reminder'
      })
      .execute();

    const result = await getUpcomingServiceReminders();

    expect(result).toHaveLength(2);
    expect(result[0].due_date).toEqual(new Date('2024-01-15'));
    expect(result[0].service_type).toEqual('oil_change');
    expect(result[1].due_date).toEqual(new Date('2024-03-01'));
    expect(result[1].service_type).toEqual('brake_service');
  });

  it('should order reminders by due mileage when due dates are null', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        license_plate: 'TEST789'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create mileage-based reminders
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'transmission_service',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 75000,
        is_completed: false,
        notes: 'Higher mileage'
      })
      .execute();

    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'air_filter_replacement',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 45000,
        is_completed: false,
        notes: 'Lower mileage'
      })
      .execute();

    const result = await getUpcomingServiceReminders();

    expect(result).toHaveLength(2);
    expect(result[0].due_mileage).toEqual(45000);
    expect(result[0].service_type).toEqual('air_filter_replacement');
    expect(result[1].due_mileage).toEqual(75000);
    expect(result[1].service_type).toEqual('transmission_service');
  });

  it('should handle mixed date and mileage based reminders', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Nissan',
        model: 'Altima',
        year: 2018,
        license_plate: 'TESTMIX'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create mixed reminder types
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'inspection',
        reminder_type: 'date_based',
        due_date: new Date('2024-02-01'),
        due_mileage: null,
        is_completed: false,
        notes: 'Date-based reminder'
      })
      .execute();

    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'battery_replacement',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 60000,
        is_completed: false,
        notes: 'Mileage-based reminder'
      })
      .execute();

    const result = await getUpcomingServiceReminders();

    expect(result).toHaveLength(2);
    // Date-based should come first (non-null due_date), then mileage-based (null due_date)
    expect(result[0].service_type).toEqual('inspection');
    expect(result[0].reminder_type).toEqual('date_based');
    expect(result[1].service_type).toEqual('battery_replacement');
    expect(result[1].reminder_type).toEqual('mileage_based');
  });

  it('should return all required fields with correct types', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'BMW',
        model: 'X5',
        year: 2022,
        license_plate: 'TESTBMW'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create a comprehensive reminder
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'coolant_service',
        reminder_type: 'date_based',
        due_date: new Date('2024-06-15'),
        due_mileage: null,
        is_completed: false,
        notes: 'Coolant needs replacement'
      })
      .execute();

    const result = await getUpcomingServiceReminders();

    expect(result).toHaveLength(1);
    const reminder = result[0];

    // Verify all fields exist and have correct types
    expect(typeof reminder.id).toBe('number');
    expect(typeof reminder.car_id).toBe('number');
    expect(reminder.service_type).toEqual('coolant_service');
    expect(reminder.reminder_type).toEqual('date_based');
    expect(reminder.due_date).toBeInstanceOf(Date);
    expect(reminder.due_mileage).toBeNull();
    expect(typeof reminder.is_completed).toBe('boolean');
    expect(reminder.is_completed).toEqual(false);
    expect(typeof reminder.notes).toBe('string');
    expect(reminder.created_at).toBeInstanceOf(Date);
  });

  it('should handle reminders with null notes', async () => {
    // Create a test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Subaru',
        model: 'Outback',
        year: 2020,
        license_plate: 'TESTNULL'
      })
      .returning()
      .execute();
    const car = carResult[0];

    // Create reminder with null notes
    await db.insert(serviceRemindersTable)
      .values({
        car_id: car.id,
        service_type: 'other',
        reminder_type: 'mileage_based',
        due_date: null,
        due_mileage: 30000,
        is_completed: false,
        notes: null
      })
      .execute();

    const result = await getUpcomingServiceReminders();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
  });
});
