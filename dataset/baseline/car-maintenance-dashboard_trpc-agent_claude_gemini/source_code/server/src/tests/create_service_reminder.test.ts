import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceRemindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateServiceReminderInput } from '../schema';
import { createServiceReminder } from '../handlers/create_service_reminder';

// Test data setup
const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  license_plate: 'ABC123'
};

const testDateBasedReminderInput: CreateServiceReminderInput = {
  car_id: 1, // Will be set dynamically in tests
  service_type: 'oil_change',
  reminder_type: 'date_based',
  due_date: new Date('2024-06-01'),
  due_mileage: null,
  notes: 'Regular oil change reminder'
};

const testMileageBasedReminderInput: CreateServiceReminderInput = {
  car_id: 1, // Will be set dynamically in tests
  service_type: 'tire_rotation',
  reminder_type: 'mileage_based',
  due_date: null,
  due_mileage: 50000,
  notes: 'Tire rotation at 50k miles'
};

describe('createServiceReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a date-based service reminder', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const testInput = {
      ...testDateBasedReminderInput,
      car_id: carResult[0].id
    };

    const result = await createServiceReminder(testInput);

    // Basic field validation
    expect(result.car_id).toEqual(carResult[0].id);
    expect(result.service_type).toEqual('oil_change');
    expect(result.reminder_type).toEqual('date_based');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString()).toEqual('2024-06-01T00:00:00.000Z');
    expect(result.due_mileage).toBeNull();
    expect(result.is_completed).toEqual(false);
    expect(result.notes).toEqual('Regular oil change reminder');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a mileage-based service reminder', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const testInput = {
      ...testMileageBasedReminderInput,
      car_id: carResult[0].id
    };

    const result = await createServiceReminder(testInput);

    // Basic field validation
    expect(result.car_id).toEqual(carResult[0].id);
    expect(result.service_type).toEqual('tire_rotation');
    expect(result.reminder_type).toEqual('mileage_based');
    expect(result.due_date).toBeNull();
    expect(result.due_mileage).toEqual(50000);
    expect(result.is_completed).toEqual(false);
    expect(result.notes).toEqual('Tire rotation at 50k miles');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service reminder to database', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const testInput = {
      ...testDateBasedReminderInput,
      car_id: carResult[0].id
    };

    const result = await createServiceReminder(testInput);

    // Query database to verify persistence
    const reminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, result.id))
      .execute();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].car_id).toEqual(carResult[0].id);
    expect(reminders[0].service_type).toEqual('oil_change');
    expect(reminders[0].reminder_type).toEqual('date_based');
    expect(reminders[0].due_date).toBeInstanceOf(Date);
    expect(reminders[0].due_mileage).toBeNull();
    expect(reminders[0].is_completed).toEqual(false);
    expect(reminders[0].notes).toEqual('Regular oil change reminder');
    expect(reminders[0].created_at).toBeInstanceOf(Date);
  });

  it('should create reminder with null notes', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const testInput = {
      ...testDateBasedReminderInput,
      car_id: carResult[0].id,
      notes: null
    };

    const result = await createServiceReminder(testInput);

    expect(result.notes).toBeNull();
    expect(result.service_type).toEqual('oil_change');
    expect(result.car_id).toEqual(carResult[0].id);
  });

  it('should create reminder for all service types', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const serviceTypes = [
      'oil_change', 'tire_rotation', 'brake_service', 'transmission_service',
      'engine_tune_up', 'air_filter_replacement', 'battery_replacement',
      'coolant_service', 'inspection', 'other'
    ] as const;

    for (const serviceType of serviceTypes) {
      const testInput = {
        ...testDateBasedReminderInput,
        car_id: carResult[0].id,
        service_type: serviceType
      };

      const result = await createServiceReminder(testInput);
      expect(result.service_type).toEqual(serviceType);
      expect(result.car_id).toEqual(carResult[0].id);
    }
  });

  it('should throw error when car does not exist', async () => {
    const testInput = {
      ...testDateBasedReminderInput,
      car_id: 99999 // Non-existent car ID
    };

    await expect(createServiceReminder(testInput)).rejects.toThrow(/Car with ID 99999 does not exist/i);
  });

  it('should handle both reminder types correctly', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    // Test date-based reminder
    const dateBasedInput = {
      ...testDateBasedReminderInput,
      car_id: carResult[0].id
    };
    const dateBasedResult = await createServiceReminder(dateBasedInput);
    expect(dateBasedResult.reminder_type).toEqual('date_based');
    expect(dateBasedResult.due_date).toBeInstanceOf(Date);
    expect(dateBasedResult.due_mileage).toBeNull();

    // Test mileage-based reminder
    const mileageBasedInput = {
      ...testMileageBasedReminderInput,
      car_id: carResult[0].id
    };
    const mileageBasedResult = await createServiceReminder(mileageBasedInput);
    expect(mileageBasedResult.reminder_type).toEqual('mileage_based');
    expect(mileageBasedResult.due_date).toBeNull();
    expect(mileageBasedResult.due_mileage).toEqual(50000);
  });

  it('should set default is_completed to false', async () => {
    // Create prerequisite car
    const carResult = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();
    
    const testInput = {
      ...testDateBasedReminderInput,
      car_id: carResult[0].id
    };

    const result = await createServiceReminder(testInput);

    expect(result.is_completed).toEqual(false);

    // Verify in database as well
    const reminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, result.id))
      .execute();

    expect(reminders[0].is_completed).toEqual(false);
  });
});
