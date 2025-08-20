import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serviceRemindersTable, carsTable } from '../db/schema';
import { type CreateServiceReminderInput } from '../schema';
import { createServiceReminder } from '../handlers/create_service_reminder';
import { eq } from 'drizzle-orm';

// Helper function to create a test car
const createTestCar = async () => {
  const carResult = await db.insert(carsTable)
    .values({
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      vin: '1HGBH41JXMN109186'
    })
    .returning()
    .execute();
  
  return carResult[0];
};

// Test input with all required fields
const createTestInput = (carId: number): CreateServiceReminderInput => ({
  car_id: carId,
  due_date: new Date('2024-06-15'),
  service_description: 'Oil change and filter replacement',
  is_completed: false
});

describe('createServiceReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service reminder', async () => {
    // Create prerequisite car first
    const car = await createTestCar();
    const testInput = createTestInput(car.id);

    const result = await createServiceReminder(testInput);

    // Basic field validation
    expect(result.car_id).toEqual(car.id);
    expect(result.due_date).toEqual(testInput.due_date);
    expect(result.service_description).toEqual('Oil change and filter replacement');
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service reminder to database', async () => {
    // Create prerequisite car first
    const car = await createTestCar();
    const testInput = createTestInput(car.id);

    const result = await createServiceReminder(testInput);

    // Query using proper drizzle syntax
    const serviceReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, result.id))
      .execute();

    expect(serviceReminders).toHaveLength(1);
    expect(serviceReminders[0].car_id).toEqual(car.id);
    expect(serviceReminders[0].service_description).toEqual('Oil change and filter replacement');
    expect(serviceReminders[0].is_completed).toEqual(false);
    expect(serviceReminders[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle is_completed default value when not provided', async () => {
    // Create prerequisite car first
    const car = await createTestCar();
    
    // Input without is_completed field
    const testInput: CreateServiceReminderInput = {
      car_id: car.id,
      due_date: new Date('2024-07-20'),
      service_description: 'Brake inspection'
    };

    const result = await createServiceReminder(testInput);

    expect(result.is_completed).toEqual(false);
    
    // Verify in database
    const serviceReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, result.id))
      .execute();

    expect(serviceReminders[0].is_completed).toEqual(false);
  });

  it('should handle is_completed when explicitly set to true', async () => {
    // Create prerequisite car first
    const car = await createTestCar();
    
    const testInput: CreateServiceReminderInput = {
      car_id: car.id,
      due_date: new Date('2024-08-10'),
      service_description: 'Tire rotation',
      is_completed: true
    };

    const result = await createServiceReminder(testInput);

    expect(result.is_completed).toEqual(true);
    
    // Verify in database
    const serviceReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, result.id))
      .execute();

    expect(serviceReminders[0].is_completed).toEqual(true);
  });

  it('should throw error when car does not exist', async () => {
    const testInput: CreateServiceReminderInput = {
      car_id: 99999, // Non-existent car ID
      due_date: new Date('2024-09-15'),
      service_description: 'Engine tune-up'
    };

    await expect(createServiceReminder(testInput)).rejects.toThrow(/car with id 99999 not found/i);
  });

  it('should create multiple service reminders for the same car', async () => {
    // Create prerequisite car first
    const car = await createTestCar();
    
    const input1: CreateServiceReminderInput = {
      car_id: car.id,
      due_date: new Date('2024-06-15'),
      service_description: 'Oil change'
    };

    const input2: CreateServiceReminderInput = {
      car_id: car.id,
      due_date: new Date('2024-12-15'),
      service_description: 'Winter tire change'
    };

    const result1 = await createServiceReminder(input1);
    const result2 = await createServiceReminder(input2);

    // Both should be created successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const allReminders = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, car.id))
      .execute();

    expect(allReminders).toHaveLength(2);
    expect(allReminders.map(r => r.service_description)).toContain('Oil change');
    expect(allReminders.map(r => r.service_description)).toContain('Winter tire change');
  });
});
