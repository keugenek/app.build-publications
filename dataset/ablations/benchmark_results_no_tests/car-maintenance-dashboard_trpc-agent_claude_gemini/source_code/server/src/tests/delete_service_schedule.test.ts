import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, serviceSchedulesTable } from '../db/schema';
import { type DeleteServiceScheduleInput } from '../schema';
import { deleteServiceSchedule } from '../handlers/delete_service_schedule';
import { eq } from 'drizzle-orm';

describe('deleteServiceSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing service schedule', async () => {
    // Create a test car first
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        license_plate: 'ABC123',
        current_mileage: 50000
      })
      .returning()
      .execute();

    // Create a test service schedule
    const [serviceSchedule] = await db.insert(serviceSchedulesTable)
      .values({
        car_id: car.id,
        service_type: 'Oil Change',
        interval_type: 'mileage',
        interval_value: 5000,
        last_service_date: new Date('2024-01-01'),
        last_service_mileage: 45000,
        is_active: true
      })
      .returning()
      .execute();

    const input: DeleteServiceScheduleInput = {
      id: serviceSchedule.id
    };

    // Delete the service schedule
    const result = await deleteServiceSchedule(input);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify service schedule was actually deleted from database
    const deletedSchedule = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.id, serviceSchedule.id))
      .execute();

    expect(deletedSchedule).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent service schedule', async () => {
    const input: DeleteServiceScheduleInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteServiceSchedule(input);

    // Should return false for non-existent service schedule
    expect(result.success).toBe(false);
  });

  it('should not affect other service schedules when deleting one', async () => {
    // Create a test car first
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        license_plate: 'XYZ789',
        current_mileage: 60000
      })
      .returning()
      .execute();

    // Create two service schedules
    const serviceSchedules = await db.insert(serviceSchedulesTable)
      .values([
        {
          car_id: car.id,
          service_type: 'Oil Change',
          interval_type: 'mileage',
          interval_value: 5000,
          last_service_date: new Date('2024-01-01'),
          last_service_mileage: 55000,
          is_active: true
        },
        {
          car_id: car.id,
          service_type: 'Tire Rotation',
          interval_type: 'mileage',
          interval_value: 10000,
          last_service_date: new Date('2024-02-01'),
          last_service_mileage: 50000,
          is_active: true
        }
      ])
      .returning()
      .execute();

    const input: DeleteServiceScheduleInput = {
      id: serviceSchedules[0].id
    };

    // Delete the first service schedule
    const result = await deleteServiceSchedule(input);

    expect(result.success).toBe(true);

    // Verify only the first schedule was deleted
    const remainingSchedules = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.car_id, car.id))
      .execute();

    expect(remainingSchedules).toHaveLength(1);
    expect(remainingSchedules[0].id).toBe(serviceSchedules[1].id);
    expect(remainingSchedules[0].service_type).toBe('Tire Rotation');
  });

  it('should handle deletion with all field types correctly', async () => {
    // Create a test car first
    const [car] = await db.insert(carsTable)
      .values({
        make: 'Ford',
        model: 'Focus',
        year: 2021,
        license_plate: 'DEF456',
        current_mileage: 30000
      })
      .returning()
      .execute();

    // Create a service schedule with all possible field combinations
    const [serviceSchedule] = await db.insert(serviceSchedulesTable)
      .values({
        car_id: car.id,
        service_type: 'Brake Service',
        interval_type: 'time',
        interval_value: 12, // 12 months
        last_service_date: null, // Nullable field
        last_service_mileage: null, // Nullable field
        next_service_date: new Date('2024-12-01'),
        next_service_mileage: 40000,
        is_active: false
      })
      .returning()
      .execute();

    const input: DeleteServiceScheduleInput = {
      id: serviceSchedule.id
    };

    // Delete the service schedule
    const result = await deleteServiceSchedule(input);

    expect(result.success).toBe(true);

    // Verify deletion
    const deletedSchedule = await db.select()
      .from(serviceSchedulesTable)
      .where(eq(serviceSchedulesTable.id, serviceSchedule.id))
      .execute();

    expect(deletedSchedule).toHaveLength(0);
  });
});
