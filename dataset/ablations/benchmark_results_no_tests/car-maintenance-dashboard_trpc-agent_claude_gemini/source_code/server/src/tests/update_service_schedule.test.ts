import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceSchedulesTable } from '../db/schema';
import { type UpdateServiceScheduleInput } from '../schema';
import { updateServiceSchedule } from '../handlers/update_service_schedule';
import { eq } from 'drizzle-orm';

describe('updateServiceSchedule', () => {
  let testCarId: number;
  let testScheduleId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test car first
    const car = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();
    
    testCarId = car[0].id;

    // Create a test service schedule
    const schedule = await db.insert(serviceSchedulesTable)
      .values({
        car_id: testCarId,
        service_type: 'Oil Change',
        interval_type: 'mileage',
        interval_value: 5000,
        last_service_date: new Date('2024-01-01'),
        last_service_mileage: 45000,
        next_service_date: null,
        next_service_mileage: 50000,
        is_active: true
      })
      .returning()
      .execute();
    
    testScheduleId = schedule[0].id;
  });

  afterEach(resetDB);

  it('should update basic service schedule fields', async () => {
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      service_type: 'Brake Inspection',
      is_active: false
    };

    const result = await updateServiceSchedule(input);

    expect(result.id).toEqual(testScheduleId);
    expect(result.service_type).toEqual('Brake Inspection');
    expect(result.is_active).toEqual(false);
    expect(result.car_id).toEqual(testCarId);
    expect(result.interval_type).toEqual('mileage'); // Should remain unchanged
    expect(result.interval_value).toEqual(5000); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should recalculate next service mileage when mileage-based data changes', async () => {
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      interval_value: 7500,
      last_service_mileage: 48000
    };

    const result = await updateServiceSchedule(input);

    expect(result.interval_value).toEqual(7500);
    expect(result.last_service_mileage).toEqual(48000);
    expect(result.next_service_mileage).toEqual(55500); // 48000 + 7500
    expect(result.next_service_date).toBeNull();
  });

  it('should recalculate next service date when time-based interval is set', async () => {
    const lastServiceDate = new Date('2024-06-01');
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      interval_type: 'time',
      interval_value: 3, // 3 months
      last_service_date: lastServiceDate
    };

    const result = await updateServiceSchedule(input);

    expect(result.interval_type).toEqual('time');
    expect(result.interval_value).toEqual(3);
    expect(result.last_service_date).toEqual(lastServiceDate);
    expect(result.next_service_date).toEqual(new Date('2024-09-01')); // 3 months later
    expect(result.next_service_mileage).toBeNull(); // Should be cleared for time-based
  });

  it('should clear irrelevant next service field when interval type changes', async () => {
    // First create a time-based schedule with next_service_date
    await db.update(serviceSchedulesTable)
      .set({
        interval_type: 'time',
        interval_value: 6,
        last_service_date: new Date('2024-01-01'),
        next_service_date: new Date('2024-07-01'),
        next_service_mileage: null
      })
      .where(eq(serviceSchedulesTable.id, testScheduleId))
      .execute();

    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      interval_type: 'mileage',
      last_service_mileage: 40000,
      interval_value: 5000
    };

    const result = await updateServiceSchedule(input);

    expect(result.interval_type).toEqual('mileage');
    expect(result.next_service_mileage).toEqual(45000); // 40000 + 5000
    expect(result.next_service_date).toBeNull(); // Should be cleared
  });

  it('should handle null values for optional date and mileage fields', async () => {
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      last_service_date: null,
      last_service_mileage: null
    };

    const result = await updateServiceSchedule(input);

    expect(result.last_service_date).toBeNull();
    expect(result.last_service_mileage).toBeNull();
    expect(result.next_service_mileage).toBeNull(); // Should be null when last_service_mileage is null
  });

  it('should save updated data to database', async () => {
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      service_type: 'Tire Rotation',
      interval_value: 6000,
      is_active: false
    };

    await updateServiceSchedule(input);

    // Verify the data was saved to database
    const schedules = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.id, testScheduleId))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].service_type).toEqual('Tire Rotation');
    expect(schedules[0].interval_value).toEqual(6000);
    expect(schedules[0].is_active).toEqual(false);
    expect(schedules[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when service schedule does not exist', async () => {
    const input: UpdateServiceScheduleInput = {
      id: 99999, // Non-existent ID
      service_type: 'Oil Change'
    };

    await expect(updateServiceSchedule(input)).rejects.toThrow(/service schedule not found/i);
  });

  it('should only update provided fields', async () => {
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      service_type: 'Air Filter Replacement'
      // Only updating service_type, other fields should remain unchanged
    };

    const result = await updateServiceSchedule(input);

    expect(result.service_type).toEqual('Air Filter Replacement');
    expect(result.interval_type).toEqual('mileage'); // Should remain unchanged
    expect(result.interval_value).toEqual(5000); // Should remain unchanged
    expect(result.last_service_mileage).toEqual(45000); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
  });

  it('should handle time-based schedule without last service date', async () => {
    const input: UpdateServiceScheduleInput = {
      id: testScheduleId,
      interval_type: 'time',
      interval_value: 12,
      last_service_date: null
    };

    const result = await updateServiceSchedule(input);

    expect(result.interval_type).toEqual('time');
    expect(result.last_service_date).toBeNull();
    expect(result.next_service_date).toBeNull(); // Cannot calculate without last service date
    expect(result.next_service_mileage).toBeNull();
  });
});
