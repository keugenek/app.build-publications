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
    // Create a test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A relaxing yoga session',
        class_type: 'yoga',
        instructor_name: 'Jane Smith',
        max_capacity: 15,
        duration_minutes: 60,
        price: '25.00'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create a test class schedule
    const startTime = new Date('2024-12-15T10:00:00Z');
    const endTime = new Date('2024-12-15T11:00:00Z');
    
    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        start_time: startTime,
        end_time: endTime,
        room_name: 'Studio A',
        is_cancelled: false
      })
      .returning()
      .execute();
    testScheduleId = scheduleResult[0].id;
  });

  it('should update class schedule start time and recalculate end time', async () => {
    const newStartTime = new Date('2024-12-15T14:00:00Z');
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      start_time: newStartTime
    };

    const result = await updateClassSchedule(input);

    expect(result.id).toEqual(testScheduleId);
    expect(result.start_time).toEqual(newStartTime);
    // End time should be recalculated based on 60-minute duration
    expect(result.end_time).toEqual(new Date('2024-12-15T15:00:00Z'));
    expect(result.room_name).toEqual('Studio A'); // Should remain unchanged
    expect(result.is_cancelled).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update room name', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      room_name: 'Studio B'
    };

    const result = await updateClassSchedule(input);

    expect(result.id).toEqual(testScheduleId);
    expect(result.room_name).toEqual('Studio B');
    expect(result.start_time).toEqual(new Date('2024-12-15T10:00:00Z')); // Should remain unchanged
    expect(result.end_time).toEqual(new Date('2024-12-15T11:00:00Z')); // Should remain unchanged
    expect(result.is_cancelled).toBe(false); // Should remain unchanged
  });

  it('should cancel a class schedule', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      is_cancelled: true
    };

    const result = await updateClassSchedule(input);

    expect(result.id).toEqual(testScheduleId);
    expect(result.is_cancelled).toBe(true);
    expect(result.start_time).toEqual(new Date('2024-12-15T10:00:00Z')); // Should remain unchanged
    expect(result.room_name).toEqual('Studio A'); // Should remain unchanged
  });

  it('should set room name to null', async () => {
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      room_name: null
    };

    const result = await updateClassSchedule(input);

    expect(result.id).toEqual(testScheduleId);
    expect(result.room_name).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const newStartTime = new Date('2024-12-15T16:00:00Z');
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      start_time: newStartTime,
      room_name: 'Studio C',
      is_cancelled: true
    };

    const result = await updateClassSchedule(input);

    expect(result.id).toEqual(testScheduleId);
    expect(result.start_time).toEqual(newStartTime);
    expect(result.end_time).toEqual(new Date('2024-12-15T17:00:00Z'));
    expect(result.room_name).toEqual('Studio C');
    expect(result.is_cancelled).toBe(true);
  });

  it('should persist changes to database', async () => {
    const newStartTime = new Date('2024-12-15T12:00:00Z');
    const input: UpdateClassScheduleInput = {
      id: testScheduleId,
      start_time: newStartTime,
      room_name: 'Studio D'
    };

    await updateClassSchedule(input);

    // Verify changes were persisted
    const schedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, testScheduleId))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].start_time).toEqual(newStartTime);
    expect(schedules[0].end_time).toEqual(new Date('2024-12-15T13:00:00Z'));
    expect(schedules[0].room_name).toEqual('Studio D');
    expect(schedules[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when class schedule does not exist', async () => {
    const input: UpdateClassScheduleInput = {
      id: 99999,
      room_name: 'Studio X'
    };

    await expect(updateClassSchedule(input)).rejects.toThrow(/Class schedule with id 99999 not found/i);
  });

  it('should handle edge case with different class durations', async () => {
    // Create a class with different duration
    const pilatesClass = await db.insert(classesTable)
      .values({
        name: 'Power Pilates',
        description: 'Intense pilates workout',
        class_type: 'pilates',
        instructor_name: 'John Doe',
        max_capacity: 12,
        duration_minutes: 45,
        price: '30.00'
      })
      .returning()
      .execute();

    const pilatesSchedule = await db.insert(classSchedulesTable)
      .values({
        class_id: pilatesClass[0].id,
        start_time: new Date('2024-12-16T09:00:00Z'),
        end_time: new Date('2024-12-16T09:45:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    const newStartTime = new Date('2024-12-16T11:00:00Z');
    const input: UpdateClassScheduleInput = {
      id: pilatesSchedule[0].id,
      start_time: newStartTime
    };

    const result = await updateClassSchedule(input);

    expect(result.start_time).toEqual(newStartTime);
    // End time should be calculated using 45-minute duration
    expect(result.end_time).toEqual(new Date('2024-12-16T11:45:00Z'));
  });
});
