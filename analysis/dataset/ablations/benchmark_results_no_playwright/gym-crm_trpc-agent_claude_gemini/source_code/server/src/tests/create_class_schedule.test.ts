import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { type CreateClassScheduleInput } from '../schema';
import { createClassSchedule } from '../handlers/create_class_schedule';
import { eq, and } from 'drizzle-orm';

describe('createClassSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test class
  const createTestClass = async () => {
    const result = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A relaxing yoga session',
        instructor_name: 'John Doe',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner',
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a class schedule successfully', async () => {
    const testClass = await createTestClass();
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    const result = await createClassSchedule(input);

    expect(result.id).toBeDefined();
    expect(result.class_id).toEqual(testClass.id);
    expect(result.scheduled_date).toEqual(new Date('2024-01-15'));
    expect(result.start_time).toEqual('09:00');
    expect(result.end_time).toEqual('10:00');
    expect(result.current_bookings).toEqual(0);
    expect(result.is_cancelled).toEqual(false);
    expect(result.cancellation_reason).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save class schedule to database', async () => {
    const testClass = await createTestClass();
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    const result = await createClassSchedule(input);

    const schedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].class_id).toEqual(testClass.id);
    expect(schedules[0].scheduled_date).toEqual('2024-01-15');
    expect(schedules[0].start_time).toEqual('09:00:00'); // PostgreSQL time columns return HH:MM:SS
    expect(schedules[0].end_time).toEqual('10:00:00');
    expect(schedules[0].current_bookings).toEqual(0);
    expect(schedules[0].is_cancelled).toEqual(false);
  });

  it('should throw error when class does not exist', async () => {
    const input: CreateClassScheduleInput = {
      class_id: 999, // Non-existent class ID
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    await expect(createClassSchedule(input)).rejects.toThrow(/Class with ID 999 not found or is not active/i);
  });

  it('should throw error when class is inactive', async () => {
    // Create an inactive class
    const result = await db.insert(classesTable)
      .values({
        name: 'Inactive Class',
        description: 'This class is not active',
        instructor_name: 'Jane Smith',
        duration_minutes: 45,
        max_capacity: 15,
        class_type: 'cardio',
        difficulty_level: 'intermediate',
        is_active: false
      })
      .returning()
      .execute();

    const inactiveClass = result[0];

    const input: CreateClassScheduleInput = {
      class_id: inactiveClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    await expect(createClassSchedule(input)).rejects.toThrow(/Class with ID .+ not found or is not active/i);
  });

  it('should throw error when start time is after end time', async () => {
    const testClass = await createTestClass();
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '10:00',
      end_time: '09:00' // End before start
    };

    await expect(createClassSchedule(input)).rejects.toThrow(/Start time must be before end time/i);
  });

  it('should throw error when start time equals end time', async () => {
    const testClass = await createTestClass();
    
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '09:00' // Same time
    };

    await expect(createClassSchedule(input)).rejects.toThrow(/Start time must be before end time/i);
  });

  it('should prevent scheduling conflicts for same instructor', async () => {
    const testClass = await createTestClass();

    // Create second class with same instructor
    const secondClassResult = await db.insert(classesTable)
      .values({
        name: 'Advanced Yoga Class',
        description: 'An advanced yoga session',
        instructor_name: 'John Doe', // Same instructor as testClass
        duration_minutes: 90,
        max_capacity: 15,
        class_type: 'yoga',
        difficulty_level: 'advanced',
        is_active: true
      })
      .returning()
      .execute();

    const secondClass = secondClassResult[0];

    // Create first schedule
    const firstInput: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    await createClassSchedule(firstInput);

    // Try to create overlapping schedule for same instructor with different class
    const conflictingInput: CreateClassScheduleInput = {
      class_id: secondClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:30',
      end_time: '10:30'
    };

    await expect(createClassSchedule(conflictingInput)).rejects.toThrow(/Scheduling conflict: Instructor John Doe is already scheduled/i);
  });

  it('should allow different instructors at overlapping times', async () => {
    const firstClass = await createTestClass();

    // Create second class with different instructor
    const secondClassResult = await db.insert(classesTable)
      .values({
        name: 'Test Pilates Class',
        description: 'A core strengthening session',
        instructor_name: 'Jane Smith', // Different instructor
        duration_minutes: 45,
        max_capacity: 15,
        class_type: 'pilates',
        difficulty_level: 'intermediate',
        is_active: true
      })
      .returning()
      .execute();

    const secondClass = secondClassResult[0];

    // Create first schedule
    const firstInput: CreateClassScheduleInput = {
      class_id: firstClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    await createClassSchedule(firstInput);

    // Create overlapping schedule with different instructor - should succeed
    const overlappingInput: CreateClassScheduleInput = {
      class_id: secondClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:30',
      end_time: '10:30'
    };

    const result = await createClassSchedule(overlappingInput);
    expect(result.id).toBeDefined();
    expect(result.class_id).toEqual(secondClass.id);
  });

  it('should allow same instructor on different dates', async () => {
    const testClass = await createTestClass();

    // Create first schedule
    const firstInput: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    await createClassSchedule(firstInput);

    // Create schedule on different date - should succeed
    const differentDateInput: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-16'), // Different date
      start_time: '09:00',
      end_time: '10:00'
    };

    const result = await createClassSchedule(differentDateInput);
    expect(result.id).toBeDefined();
    expect(result.class_id).toEqual(testClass.id);
    expect(result.scheduled_date).toEqual(new Date('2024-01-16'));
  });

  it('should ignore cancelled schedules when checking conflicts', async () => {
    const testClass = await createTestClass();

    // Create a cancelled schedule
    await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        is_cancelled: true,
        cancellation_reason: 'Instructor unavailable'
      })
      .execute();

    // Try to create overlapping schedule - should succeed because existing one is cancelled
    const input: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:30',
      end_time: '10:30'
    };

    const result = await createClassSchedule(input);
    expect(result.id).toBeDefined();
    expect(result.class_id).toEqual(testClass.id);
  });

  it('should detect edge case time conflicts', async () => {
    const testClass = await createTestClass();

    // Create second class with same instructor for proper conflict testing
    const secondClassResult = await db.insert(classesTable)
      .values({
        name: 'Advanced Yoga Class',
        description: 'An advanced yoga session',
        instructor_name: 'John Doe', // Same instructor as testClass
        duration_minutes: 60,
        max_capacity: 15,
        class_type: 'yoga',
        difficulty_level: 'advanced',
        is_active: true
      })
      .returning()
      .execute();

    const secondClass = secondClassResult[0];

    // Create first schedule
    const firstInput: CreateClassScheduleInput = {
      class_id: testClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '09:00',
      end_time: '10:00'
    };

    await createClassSchedule(firstInput);

    // Test edge case when new schedule starts exactly when existing ends - should NOT conflict
    const edgeInput: CreateClassScheduleInput = {
      class_id: secondClass.id,
      scheduled_date: new Date('2024-01-15'),
      start_time: '10:00', // Starts exactly when first ends
      end_time: '11:00'
    };

    // This should NOT conflict because start time equals end time (no overlap)
    const result = await createClassSchedule(edgeInput);
    expect(result.id).toBeDefined();
  });
});
