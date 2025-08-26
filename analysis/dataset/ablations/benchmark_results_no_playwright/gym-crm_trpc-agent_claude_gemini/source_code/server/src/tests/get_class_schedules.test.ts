import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { type GetClassSchedulesInput } from '../schema';
import { getClassSchedules } from '../handlers/get_class_schedules';

describe('getClassSchedules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test class
  const createTestClass = async (overrides = {}) => {
    const classData = {
      name: 'Test Yoga Class',
      description: 'A relaxing yoga session',
      instructor_name: 'Jane Doe',
      duration_minutes: 60,
      max_capacity: 20,
      class_type: 'yoga' as const,
      difficulty_level: 'beginner' as const,
      ...overrides
    };

    const result = await db.insert(classesTable)
      .values(classData)
      .returning()
      .execute();

    return result[0];
  };

  // Helper function to create test schedule
  const createTestSchedule = async (class_id: number, overrides = {}) => {
    const scheduleData = {
      class_id,
      scheduled_date: '2024-01-15', // Use string format for database
      start_time: '10:00',
      end_time: '11:00',
      current_bookings: 5,
      ...overrides
    };

    const result = await db.insert(classSchedulesTable)
      .values(scheduleData)
      .returning()
      .execute();

    return result[0];
  };

  it('should return all class schedules when no filters provided', async () => {
    // Create test class and schedules
    const testClass = await createTestClass();
    const schedule1 = await createTestSchedule(testClass.id);
    const schedule2 = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-16',
      start_time: '14:00',
      end_time: '15:00'
    });

    const result = await getClassSchedules();

    expect(result).toHaveLength(2);
    
    // Verify first schedule
    expect(result[0].id).toEqual(schedule1.id);
    expect(result[0].class_id).toEqual(testClass.id);
    expect(result[0].scheduled_date).toEqual(new Date('2024-01-15'));
    expect(result[0].start_time).toEqual('10:00:00');
    expect(result[0].end_time).toEqual('11:00:00');
    expect(result[0].current_bookings).toEqual(5);
    expect(result[0].is_cancelled).toEqual(false);
    expect(result[0].cancellation_reason).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second schedule
    expect(result[1].id).toEqual(schedule2.id);
    expect(result[1].scheduled_date).toEqual(new Date('2024-01-16'));
    expect(result[1].start_time).toEqual('14:00:00');
  });

  it('should filter by date range', async () => {
    const testClass = await createTestClass();
    
    // Create schedules on different dates
    await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-10'
    });
    const validSchedule = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-15'
    });
    await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-25'
    });

    const filters: GetClassSchedulesInput = {
      date_from: new Date('2024-01-14'),
      date_to: new Date('2024-01-20')
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(validSchedule.id);
    expect(result[0].scheduled_date).toEqual(new Date('2024-01-15'));
  });

  it('should filter by specific class', async () => {
    const yogaClass = await createTestClass({ name: 'Yoga Class' });
    const cardioClass = await createTestClass({ 
      name: 'Cardio Class', 
      class_type: 'cardio' 
    });

    await createTestSchedule(yogaClass.id);
    const cardioSchedule = await createTestSchedule(cardioClass.id);

    const filters: GetClassSchedulesInput = {
      class_id: cardioClass.id
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(cardioSchedule.id);
    expect(result[0].class_id).toEqual(cardioClass.id);
  });

  it('should filter by class type', async () => {
    const yogaClass = await createTestClass({ 
      name: 'Yoga Class',
      class_type: 'yoga' 
    });
    const strengthClass = await createTestClass({ 
      name: 'Strength Class',
      class_type: 'strength' 
    });

    const yogaSchedule = await createTestSchedule(yogaClass.id);
    await createTestSchedule(strengthClass.id);

    const filters: GetClassSchedulesInput = {
      class_type: 'yoga'
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(yogaSchedule.id);
    expect(result[0].class_id).toEqual(yogaClass.id);
  });

  it('should apply multiple filters correctly', async () => {
    const yogaClass = await createTestClass({ 
      class_type: 'yoga' 
    });
    const cardioClass = await createTestClass({ 
      class_type: 'cardio' 
    });

    // Create yoga schedule within date range
    const validSchedule = await createTestSchedule(yogaClass.id, {
      scheduled_date: '2024-01-15'
    });

    // Create yoga schedule outside date range
    await createTestSchedule(yogaClass.id, {
      scheduled_date: '2024-01-25'
    });

    // Create cardio schedule within date range
    await createTestSchedule(cardioClass.id, {
      scheduled_date: '2024-01-16'
    });

    const filters: GetClassSchedulesInput = {
      date_from: new Date('2024-01-14'),
      date_to: new Date('2024-01-20'),
      class_type: 'yoga'
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(validSchedule.id);
    expect(result[0].class_id).toEqual(yogaClass.id);
  });

  it('should return schedules ordered by date and time', async () => {
    const testClass = await createTestClass();

    // Create schedules in mixed order
    const schedule3 = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-16',
      start_time: '09:00',
      end_time: '10:00'
    });

    const schedule1 = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-15',
      start_time: '10:00',
      end_time: '11:00'
    });

    const schedule2 = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-15',
      start_time: '14:00',
      end_time: '15:00'
    });

    const result = await getClassSchedules();

    expect(result).toHaveLength(3);
    
    // Should be ordered chronologically
    expect(result[0].id).toEqual(schedule1.id);
    expect(result[0].scheduled_date).toEqual(new Date('2024-01-15'));
    expect(result[0].start_time).toEqual('10:00:00');

    expect(result[1].id).toEqual(schedule2.id);
    expect(result[1].scheduled_date).toEqual(new Date('2024-01-15'));
    expect(result[1].start_time).toEqual('14:00:00');

    expect(result[2].id).toEqual(schedule3.id);
    expect(result[2].scheduled_date).toEqual(new Date('2024-01-16'));
    expect(result[2].start_time).toEqual('09:00:00');
  });

  it('should include cancelled schedules with cancellation reason', async () => {
    const testClass = await createTestClass();
    const cancelledSchedule = await createTestSchedule(testClass.id, {
      is_cancelled: true,
      cancellation_reason: 'Instructor unavailable'
    });

    const result = await getClassSchedules();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(cancelledSchedule.id);
    expect(result[0].is_cancelled).toEqual(true);
    expect(result[0].cancellation_reason).toEqual('Instructor unavailable');
  });

  it('should return empty array when no schedules match filters', async () => {
    const testClass = await createTestClass({ class_type: 'yoga' });
    await createTestSchedule(testClass.id);

    const filters: GetClassSchedulesInput = {
      class_type: 'cardio' // No cardio classes exist
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle edge case with only date_from filter', async () => {
    const testClass = await createTestClass();
    
    await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-10'
    });
    
    const validSchedule = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-20'
    });

    const filters: GetClassSchedulesInput = {
      date_from: new Date('2024-01-15')
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(validSchedule.id);
  });

  it('should handle edge case with only date_to filter', async () => {
    const testClass = await createTestClass();
    
    const validSchedule = await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-10'
    });
    
    await createTestSchedule(testClass.id, {
      scheduled_date: '2024-01-20'
    });

    const filters: GetClassSchedulesInput = {
      date_to: new Date('2024-01-15')
    };

    const result = await getClassSchedules(filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(validSchedule.id);
  });
});
