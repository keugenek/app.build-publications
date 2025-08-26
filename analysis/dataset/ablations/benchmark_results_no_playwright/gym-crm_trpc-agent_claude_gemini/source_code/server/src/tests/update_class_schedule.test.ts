import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { type UpdateClassScheduleInput } from '../schema';
import { updateClassSchedule } from '../handlers/update_class_schedule';
import { eq } from 'drizzle-orm';

describe('updateClassSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testClassId: number;
  let testScheduleId: number;

  beforeEach(async () => {
    // Create a test class first
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Instructor',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner',
        is_active: true
      })
      .returning()
      .execute();
    
    testClassId = classResult[0].id;

    // Create a test schedule for tomorrow (to avoid past date issues)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        scheduled_date: tomorrow.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 5
      })
      .returning()
      .execute();
    
    testScheduleId = scheduleResult[0].id;
  });

  it('should update class schedule fields', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      start_time: '10:00',
      end_time: '11:00'
    };

    const result = await updateClassSchedule(input);

    expect(result.id).toBe(testScheduleId);
    expect(result.start_time).toBe('10:00:00');
    expect(result.end_time).toBe('11:00:00');
    expect(result.class_id).toBe(testClassId);
    expect(result.current_bookings).toBe(5); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update schedule cancellation status', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      is_cancelled: true,
      cancellation_reason: 'Instructor unavailable'
    };

    const result = await updateClassSchedule(input);

    expect(result.is_cancelled).toBe(true);
    expect(result.cancellation_reason).toBe('Instructor unavailable');
    expect(result.start_time).toBe('09:00:00'); // Should remain unchanged
    expect(result.end_time).toBe('10:00:00'); // Should remain unchanged
  });

  it('should update scheduled date', async () => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 3); // 3 days from now

    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      scheduled_date: newDate
    };

    const result = await updateClassSchedule(input);

    const expectedDate = new Date(newDate.toISOString().split('T')[0]);
    expect(result.scheduled_date.toISOString().split('T')[0]).toBe(expectedDate.toISOString().split('T')[0]);
    expect(result.class_id).toBe(testClassId);
  });

  it('should save updated schedule to database', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      start_time: '14:30',
      end_time: '15:30',
      is_cancelled: true,
      cancellation_reason: 'Equipment maintenance'
    };

    await updateClassSchedule(input);

    // Verify changes are persisted
    const schedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, testScheduleId))
      .execute();

    expect(schedules).toHaveLength(1);
    const schedule = schedules[0];
    expect(schedule.start_time).toBe('14:30:00');
    expect(schedule.end_time).toBe('15:30:00');
    expect(schedule.is_cancelled).toBe(true);
    expect(schedule.cancellation_reason).toBe('Equipment maintenance');
    expect(schedule.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent schedule', async () => {
    const input: UpdateClassScheduleInput = {
      id: 99999,
      start_time: '10:00'
    };

    await expect(updateClassSchedule(input)).rejects.toThrow(/not found/i);
  });

  it('should prevent updates to past scheduled classes', async () => {
    // Create a schedule for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pastScheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        scheduled_date: yesterday.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
        start_time: '09:00',
        end_time: '10:00'
      })
      .returning()
      .execute();

    const input: UpdateClassScheduleInput = {
      id: pastScheduleResult[0].id,
      start_time: '10:00'
    };

    await expect(updateClassSchedule(input)).rejects.toThrow(/cannot update past/i);
  });

  it('should handle partial updates correctly', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      cancellation_reason: 'Updated reason only'
    };

    const result = await updateClassSchedule(input);

    expect(result.cancellation_reason).toBe('Updated reason only');
    expect(result.is_cancelled).toBe(false); // Should remain unchanged
    expect(result.start_time).toBe('09:00:00'); // Should remain unchanged
    expect(result.current_bookings).toBe(5); // Should remain unchanged
  });

  it('should clear cancellation reason when set to null', async () => {
    // First set a cancellation reason
    await db.update(classSchedulesTable)
      .set({ 
        is_cancelled: true, 
        cancellation_reason: 'Initial reason' 
      })
      .where(eq(classSchedulesTable.id, testScheduleId))
      .execute();

    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      is_cancelled: false,
      cancellation_reason: null
    };

    const result = await updateClassSchedule(input);

    expect(result.is_cancelled).toBe(false);
    expect(result.cancellation_reason).toBeNull();
  });
});
