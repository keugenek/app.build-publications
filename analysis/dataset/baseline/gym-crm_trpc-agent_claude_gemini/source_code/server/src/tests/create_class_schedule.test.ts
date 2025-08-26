import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { type CreateClassScheduleInput } from '../schema';
import { createClassSchedule } from '../handlers/create_class_schedule';
import { eq } from 'drizzle-orm';

describe('createClassSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test class
  const createTestClass = async () => {
    const result = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A relaxing yoga class',
        class_type: 'yoga',
        instructor_name: 'Jane Doe',
        max_capacity: 20,
        duration_minutes: 60,
        price: '25.00',
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a class schedule with correct end time calculation', async () => {
    const testClass = await createTestClass();
    const startTime = new Date('2024-01-15T10:00:00Z');
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      start_time: startTime,
      room_name: 'Studio A'
    };

    const result = await createClassSchedule(input);

    // Basic field validation
    expect(result.class_id).toEqual(testClass.id);
    expect(result.start_time).toEqual(startTime);
    expect(result.room_name).toEqual('Studio A');
    expect(result.is_cancelled).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify end time is calculated correctly (start_time + duration_minutes)
    const expectedEndTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 60 minutes later
    expect(result.end_time).toEqual(expectedEndTime);
  });

  it('should save class schedule to database', async () => {
    const testClass = await createTestClass();
    const startTime = new Date('2024-01-15T14:30:00Z');
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      start_time: startTime,
      room_name: 'Studio B'
    };

    const result = await createClassSchedule(input);

    // Query the database to verify the record was saved
    const schedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    const savedSchedule = schedules[0];
    expect(savedSchedule.class_id).toEqual(testClass.id);
    expect(savedSchedule.start_time).toEqual(startTime);
    expect(savedSchedule.room_name).toEqual('Studio B');
    expect(savedSchedule.is_cancelled).toBe(false);
  });

  it('should handle different class durations correctly', async () => {
    // Create a class with 90-minute duration
    const longClass = await db.insert(classesTable)
      .values({
        name: 'Long Pilates Session',
        description: 'Extended pilates class',
        class_type: 'pilates',
        instructor_name: 'John Smith',
        max_capacity: 15,
        duration_minutes: 90,
        price: '35.00',
        is_active: true
      })
      .returning()
      .execute();

    const startTime = new Date('2024-01-16T09:00:00Z');
    
    const input: CreateClassScheduleInput = {
      class_id: longClass[0].id,
      start_time: startTime,
      room_name: 'Studio C'
    };

    const result = await createClassSchedule(input);

    // Verify end time is calculated for 90 minutes
    const expectedEndTime = new Date(startTime.getTime() + 90 * 60 * 1000); // 90 minutes later
    expect(result.end_time).toEqual(expectedEndTime);
  });

  it('should allow null room_name', async () => {
    const testClass = await createTestClass();
    const startTime = new Date('2024-01-17T16:00:00Z');
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      start_time: startTime,
      room_name: null
    };

    const result = await createClassSchedule(input);

    expect(result.room_name).toBeNull();
    expect(result.class_id).toEqual(testClass.id);
    expect(result.start_time).toEqual(startTime);
  });

  it('should throw error when class does not exist', async () => {
    const input: CreateClassScheduleInput = {
      class_id: 999999, // Non-existent class ID
      start_time: new Date('2024-01-15T10:00:00Z'),
      room_name: 'Studio A'
    };

    await expect(createClassSchedule(input)).rejects.toThrow(/Class with id 999999 not found/i);
  });

  it('should create multiple schedules for the same class', async () => {
    const testClass = await createTestClass();
    
    const input1: CreateClassScheduleInput = {
      class_id: testClass.id,
      start_time: new Date('2024-01-15T10:00:00Z'),
      room_name: 'Studio A'
    };

    const input2: CreateClassScheduleInput = {
      class_id: testClass.id,
      start_time: new Date('2024-01-15T14:00:00Z'),
      room_name: 'Studio B'
    };

    const result1 = await createClassSchedule(input1);
    const result2 = await createClassSchedule(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.class_id).toEqual(testClass.id);
    expect(result2.class_id).toEqual(testClass.id);
    expect(result1.room_name).toEqual('Studio A');
    expect(result2.room_name).toEqual('Studio B');

    // Verify both are in database
    const allSchedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.class_id, testClass.id))
      .execute();

    expect(allSchedules).toHaveLength(2);
  });
});
