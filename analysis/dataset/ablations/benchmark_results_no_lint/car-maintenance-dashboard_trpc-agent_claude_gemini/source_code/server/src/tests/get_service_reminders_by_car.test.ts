import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { type GetServiceRemindersByCarInput } from '../schema';
import { getServiceRemindersByCar } from '../handlers/get_service_reminders_by_car';

describe('getServiceRemindersByCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return service reminders for a specific car ordered by due date', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1234567890ABCDEFG'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create test service reminders with different due dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          due_date: nextWeek, // Later date
          service_description: 'Oil Change',
          is_completed: false
        },
        {
          car_id: carId,
          due_date: today, // Earliest date
          service_description: 'Tire Rotation',
          is_completed: true
        },
        {
          car_id: carId,
          due_date: tomorrow, // Middle date
          service_description: 'Brake Inspection',
          is_completed: false
        }
      ])
      .execute();

    const input: GetServiceRemindersByCarInput = {
      car_id: carId
    };

    const result = await getServiceRemindersByCar(input);

    // Should return 3 reminders
    expect(result).toHaveLength(3);

    // Should be ordered by due date (earliest first)
    expect(result[0].service_description).toEqual('Tire Rotation');
    expect(result[1].service_description).toEqual('Brake Inspection');
    expect(result[2].service_description).toEqual('Oil Change');

    // Validate all fields are present and correct types
    result.forEach(reminder => {
      expect(reminder.id).toBeDefined();
      expect(reminder.car_id).toEqual(carId);
      expect(reminder.due_date).toBeInstanceOf(Date);
      expect(typeof reminder.service_description).toBe('string');
      expect(typeof reminder.is_completed).toBe('boolean');
      expect(reminder.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no service reminders exist for the car', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: 'ABCDEFG1234567890'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    const input: GetServiceRemindersByCarInput = {
      car_id: carId
    };

    const result = await getServiceRemindersByCar(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent car', async () => {
    const input: GetServiceRemindersByCarInput = {
      car_id: 99999 // Non-existent car ID
    };

    const result = await getServiceRemindersByCar(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return reminders for the specified car', async () => {
    // Create two test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1111111111AAAAAAA'
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: '2222222222BBBBBBB'
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    const today = new Date();

    // Create service reminders for both cars
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: car1Id,
          due_date: today,
          service_description: 'Car 1 - Oil Change',
          is_completed: false
        },
        {
          car_id: car2Id,
          due_date: today,
          service_description: 'Car 2 - Brake Check',
          is_completed: false
        },
        {
          car_id: car1Id,
          due_date: today,
          service_description: 'Car 1 - Tire Rotation',
          is_completed: true
        }
      ])
      .execute();

    // Query reminders for car 1
    const input: GetServiceRemindersByCarInput = {
      car_id: car1Id
    };

    const result = await getServiceRemindersByCar(input);

    // Should return only 2 reminders (both for car 1)
    expect(result).toHaveLength(2);

    // All results should be for car 1
    result.forEach(reminder => {
      expect(reminder.car_id).toEqual(car1Id);
      expect(reminder.service_description).toMatch(/Car 1/);
    });

    // Verify the specific reminders
    const descriptions = result.map(r => r.service_description).sort();
    expect(descriptions).toEqual(['Car 1 - Oil Change', 'Car 1 - Tire Rotation']);
  });

  it('should handle reminders with various completion statuses', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        vin: 'FORD123456789ABCD'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    const today = new Date();

    // Create reminders with different completion statuses
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          due_date: today,
          service_description: 'Completed Service',
          is_completed: true
        },
        {
          car_id: carId,
          due_date: today,
          service_description: 'Pending Service',
          is_completed: false
        }
      ])
      .execute();

    const input: GetServiceRemindersByCarInput = {
      car_id: carId
    };

    const result = await getServiceRemindersByCar(input);

    expect(result).toHaveLength(2);

    // Find completed and pending reminders
    const completedReminder = result.find(r => r.is_completed === true);
    const pendingReminder = result.find(r => r.is_completed === false);

    expect(completedReminder).toBeDefined();
    expect(completedReminder!.service_description).toEqual('Completed Service');

    expect(pendingReminder).toBeDefined();
    expect(pendingReminder!.service_description).toEqual('Pending Service');
  });
});
