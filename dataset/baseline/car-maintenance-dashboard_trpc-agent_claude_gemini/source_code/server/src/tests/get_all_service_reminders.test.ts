import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { getAllServiceReminders } from '../handlers/get_all_service_reminders';

describe('getAllServiceReminders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no service reminders exist', async () => {
    const result = await getAllServiceReminders();
    expect(result).toEqual([]);
  });

  it('should return all service reminders', async () => {
    // Create test car first
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

    // Create multiple test service reminders
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          service_type: 'oil_change',
          reminder_type: 'date_based',
          due_date: new Date('2024-06-01'),
          due_mileage: null,
          notes: 'Regular oil change'
        },
        {
          car_id: carId,
          service_type: 'tire_rotation',
          reminder_type: 'mileage_based',
          due_date: null,
          due_mileage: 50000,
          notes: 'Rotate tires'
        },
        {
          car_id: carId,
          service_type: 'brake_service',
          reminder_type: 'date_based',
          due_date: new Date('2024-12-01'),
          due_mileage: null,
          is_completed: true,
          notes: null
        }
      ])
      .execute();

    const result = await getAllServiceReminders();

    expect(result).toHaveLength(3);
    
    // Check first reminder (date-based)
    const oilChangeReminder = result.find(r => r.service_type === 'oil_change');
    expect(oilChangeReminder).toBeDefined();
    expect(oilChangeReminder!.car_id).toEqual(carId);
    expect(oilChangeReminder!.reminder_type).toEqual('date_based');
    expect(oilChangeReminder!.due_date).toBeInstanceOf(Date);
    expect(oilChangeReminder!.due_mileage).toBeNull();
    expect(oilChangeReminder!.is_completed).toBe(false);
    expect(oilChangeReminder!.notes).toEqual('Regular oil change');
    expect(oilChangeReminder!.created_at).toBeInstanceOf(Date);
    expect(oilChangeReminder!.id).toBeDefined();

    // Check second reminder (mileage-based)
    const tireRotationReminder = result.find(r => r.service_type === 'tire_rotation');
    expect(tireRotationReminder).toBeDefined();
    expect(tireRotationReminder!.car_id).toEqual(carId);
    expect(tireRotationReminder!.reminder_type).toEqual('mileage_based');
    expect(tireRotationReminder!.due_date).toBeNull();
    expect(tireRotationReminder!.due_mileage).toEqual(50000);
    expect(typeof tireRotationReminder!.due_mileage).toBe('number');
    expect(tireRotationReminder!.is_completed).toBe(false);
    expect(tireRotationReminder!.notes).toEqual('Rotate tires');

    // Check third reminder (completed)
    const brakeServiceReminder = result.find(r => r.service_type === 'brake_service');
    expect(brakeServiceReminder).toBeDefined();
    expect(brakeServiceReminder!.is_completed).toBe(true);
    expect(brakeServiceReminder!.notes).toBeNull();
  });

  it('should handle multiple cars with reminders', async () => {
    // Create multiple test cars
    const car1Result = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123'
      })
      .returning()
      .execute();

    const car2Result = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789'
      })
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Create reminders for both cars
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: car1Id,
          service_type: 'oil_change',
          reminder_type: 'date_based',
          due_date: new Date('2024-06-01'),
          due_mileage: null,
          notes: 'Toyota oil change'
        },
        {
          car_id: car2Id,
          service_type: 'inspection',
          reminder_type: 'mileage_based',
          due_date: null,
          due_mileage: 75000,
          notes: 'Honda inspection'
        }
      ])
      .execute();

    const result = await getAllServiceReminders();

    expect(result).toHaveLength(2);
    
    const car1Reminders = result.filter(r => r.car_id === car1Id);
    const car2Reminders = result.filter(r => r.car_id === car2Id);

    expect(car1Reminders).toHaveLength(1);
    expect(car2Reminders).toHaveLength(1);

    expect(car1Reminders[0].service_type).toEqual('oil_change');
    expect(car1Reminders[0].notes).toEqual('Toyota oil change');

    expect(car2Reminders[0].service_type).toEqual('inspection');
    expect(car2Reminders[0].notes).toEqual('Honda inspection');
    expect(car2Reminders[0].due_mileage).toEqual(75000);
  });

  it('should handle all service types correctly', async () => {
    // Create test car
    const carResult = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        license_plate: 'TRUCK1'
      })
      .returning()
      .execute();

    const carId = carResult[0].id;

    // Create reminders with different service types
    await db.insert(serviceRemindersTable)
      .values([
        {
          car_id: carId,
          service_type: 'engine_tune_up',
          reminder_type: 'date_based',
          due_date: new Date('2024-08-01'),
          due_mileage: null,
          notes: 'Engine tune-up'
        },
        {
          car_id: carId,
          service_type: 'air_filter_replacement',
          reminder_type: 'mileage_based',
          due_date: null,
          due_mileage: 30000,
          notes: 'Replace air filter'
        },
        {
          car_id: carId,
          service_type: 'other',
          reminder_type: 'date_based',
          due_date: new Date('2024-09-15'),
          due_mileage: null,
          notes: 'Custom service'
        }
      ])
      .execute();

    const result = await getAllServiceReminders();

    expect(result).toHaveLength(3);

    const serviceTypes = result.map(r => r.service_type);
    expect(serviceTypes).toContain('engine_tune_up');
    expect(serviceTypes).toContain('air_filter_replacement');
    expect(serviceTypes).toContain('other');
  });
});
