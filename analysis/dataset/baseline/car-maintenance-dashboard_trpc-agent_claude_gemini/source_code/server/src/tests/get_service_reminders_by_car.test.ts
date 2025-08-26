import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { type GetServiceRemindersByCarInput } from '../schema';
import { getServiceRemindersByCarId } from '../handlers/get_service_reminders_by_car';

// Test data
const testCar = {
  make: 'Honda',
  model: 'Civic',
  year: 2020,
  license_plate: 'ABC123'
};

const testServiceReminder1 = {
  service_type: 'oil_change' as const,
  reminder_type: 'date_based' as const,
  due_date: new Date('2024-06-01'),
  due_mileage: null,
  is_completed: false,
  notes: 'Regular oil change due'
};

const testServiceReminder2 = {
  service_type: 'tire_rotation' as const,
  reminder_type: 'mileage_based' as const,
  due_date: null,
  due_mileage: 50000,
  is_completed: true,
  notes: 'Tire rotation completed'
};

describe('getServiceRemindersByCarId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when car has no service reminders', async () => {
    // Create a car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const carId = carResult[0].id;

    const input: GetServiceRemindersByCarInput = {
      car_id: carId
    };

    const result = await getServiceRemindersByCarId(input);

    expect(result).toEqual([]);
  });

  it('should return service reminders for a specific car', async () => {
    // Create a car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create service reminders for this car
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          ...testServiceReminder1
        },
        {
          car_id: carId,
          ...testServiceReminder2
        }
      ])
      .execute();

    const input: GetServiceRemindersByCarInput = {
      car_id: carId
    };

    const result = await getServiceRemindersByCarId(input);

    expect(result).toHaveLength(2);
    
    // Check first reminder
    const oilChangeReminder = result.find(r => r.service_type === 'oil_change');
    expect(oilChangeReminder).toBeDefined();
    expect(oilChangeReminder!.car_id).toEqual(carId);
    expect(oilChangeReminder!.reminder_type).toEqual('date_based');
    expect(oilChangeReminder!.due_date).toBeInstanceOf(Date);
    expect(oilChangeReminder!.due_mileage).toBeNull();
    expect(oilChangeReminder!.is_completed).toBe(false);
    expect(oilChangeReminder!.notes).toEqual('Regular oil change due');
    expect(oilChangeReminder!.id).toBeDefined();
    expect(oilChangeReminder!.created_at).toBeInstanceOf(Date);

    // Check second reminder
    const tireRotationReminder = result.find(r => r.service_type === 'tire_rotation');
    expect(tireRotationReminder).toBeDefined();
    expect(tireRotationReminder!.car_id).toEqual(carId);
    expect(tireRotationReminder!.reminder_type).toEqual('mileage_based');
    expect(tireRotationReminder!.due_date).toBeNull();
    expect(tireRotationReminder!.due_mileage).toEqual(50000);
    expect(tireRotationReminder!.is_completed).toBe(true);
    expect(tireRotationReminder!.notes).toEqual('Tire rotation completed');
    expect(tireRotationReminder!.id).toBeDefined();
    expect(tireRotationReminder!.created_at).toBeInstanceOf(Date);
  });

  it('should only return reminders for the specified car', async () => {
    // Create two cars
    const car1Result = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2019,
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create service reminders for both cars
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: car1Id,
          ...testServiceReminder1
        },
        {
          car_id: car2Id,
          service_type: 'brake_service' as const,
          reminder_type: 'date_based' as const,
          due_date: new Date('2024-07-01'),
          due_mileage: null,
          is_completed: false,
          notes: 'Brake service due'
        }
      ])
      .execute();

    const input: GetServiceRemindersByCarInput = {
      car_id: car1Id
    };

    const result = await getServiceRemindersByCarId(input);

    expect(result).toHaveLength(1);
    expect(result[0].car_id).toEqual(car1Id);
    expect(result[0].service_type).toEqual('oil_change');
  });

  it('should return empty array for non-existent car', async () => {
    const input: GetServiceRemindersByCarInput = {
      car_id: 99999
    };

    const result = await getServiceRemindersByCarId(input);

    expect(result).toEqual([]);
  });

  it('should handle multiple service types correctly', async () => {
    // Create a car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create multiple service reminders with different types
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          service_type: 'oil_change' as const,
          reminder_type: 'date_based' as const,
          due_date: new Date('2024-06-01'),
          due_mileage: null,
          is_completed: false,
          notes: null
        },
        {
          car_id: carId,
          service_type: 'brake_service' as const,
          reminder_type: 'mileage_based' as const,
          due_date: null,
          due_mileage: 60000,
          is_completed: true,
          notes: 'Brake service completed'
        },
        {
          car_id: carId,
          service_type: 'inspection' as const,
          reminder_type: 'date_based' as const,
          due_date: new Date('2024-12-01'),
          due_mileage: null,
          is_completed: false,
          notes: 'Annual inspection'
        }
      ])
      .execute();

    const input: GetServiceRemindersByCarInput = {
      car_id: carId
    };

    const result = await getServiceRemindersByCarId(input);

    expect(result).toHaveLength(3);
    
    // Verify all service types are present
    const serviceTypes = result.map(r => r.service_type).sort();
    expect(serviceTypes).toEqual(['brake_service', 'inspection', 'oil_change']);

    // Verify each reminder has correct data structure
    result.forEach(reminder => {
      expect(reminder.id).toBeDefined();
      expect(reminder.car_id).toEqual(carId);
      expect(['oil_change', 'brake_service', 'inspection']).toContain(reminder.service_type);
      expect(['date_based', 'mileage_based']).toContain(reminder.reminder_type);
      expect(typeof reminder.is_completed).toBe('boolean');
      expect(reminder.created_at).toBeInstanceOf(Date);
    });
  });
});
