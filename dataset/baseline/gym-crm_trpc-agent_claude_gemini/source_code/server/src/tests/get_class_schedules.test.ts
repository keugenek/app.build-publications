import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, classSchedulesTable } from '../db/schema';
import { type GetClassSchedulesQuery } from '../schema';
import { getClassSchedules } from '../handlers/get_class_schedules';

describe('getClassSchedules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Setup test data
  const setupTestData = async () => {
    // Create a test class first
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A yoga class for testing',
        class_type: 'yoga',
        instructor_name: 'Test Instructor',
        max_capacity: 20,
        duration_minutes: 60,
        price: '25.00'
      })
      .returning()
      .execute();

    const classId = testClass[0].id;

    // Create another class with different type
    const testClass2 = await db.insert(classesTable)
      .values({
        name: 'Test Pilates Class',
        description: 'A pilates class for testing',
        class_type: 'pilates',
        instructor_name: 'Test Instructor 2',
        max_capacity: 15,
        duration_minutes: 45,
        price: '30.00'
      })
      .returning()
      .execute();

    const class2Id = testClass2[0].id;

    // Create test schedules with different dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Schedule for today - yoga
    const schedule1 = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        start_time: today,
        end_time: new Date(today.getTime() + 60 * 60 * 1000), // 1 hour later
        room_name: 'Room A'
      })
      .returning()
      .execute();

    // Schedule for tomorrow - pilates
    const schedule2 = await db.insert(classSchedulesTable)
      .values({
        class_id: class2Id,
        start_time: tomorrow,
        end_time: new Date(tomorrow.getTime() + 45 * 60 * 1000), // 45 minutes later
        room_name: 'Room B'
      })
      .returning()
      .execute();

    // Schedule for next week - yoga (cancelled)
    const schedule3 = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        start_time: nextWeek,
        end_time: new Date(nextWeek.getTime() + 60 * 60 * 1000), // 1 hour later
        room_name: 'Room C',
        is_cancelled: true
      })
      .returning()
      .execute();

    return {
      classId,
      class2Id,
      schedule1: schedule1[0],
      schedule2: schedule2[0],
      schedule3: schedule3[0],
      today,
      tomorrow,
      nextWeek
    };
  };

  it('should return all class schedules when no filter is provided', async () => {
    const testData = await setupTestData();
    
    const result = await getClassSchedules();
    
    expect(result).toHaveLength(3);
    
    // Verify all schedules are returned
    const scheduleIds = result.map(s => s.id);
    expect(scheduleIds).toContain(testData.schedule1.id);
    expect(scheduleIds).toContain(testData.schedule2.id);
    expect(scheduleIds).toContain(testData.schedule3.id);
    
    // Verify structure of returned data
    result.forEach(schedule => {
      expect(schedule.id).toBeDefined();
      expect(schedule.class_id).toBeDefined();
      expect(schedule.start_time).toBeInstanceOf(Date);
      expect(schedule.end_time).toBeInstanceOf(Date);
      expect(typeof schedule.is_cancelled).toBe('boolean');
      expect(schedule.created_at).toBeInstanceOf(Date);
      expect(schedule.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter by start_date correctly', async () => {
    const testData = await setupTestData();
    
    const query: GetClassSchedulesQuery = {
      start_date: testData.tomorrow
    };
    
    const result = await getClassSchedules(query);
    
    // Should only return schedules starting from tomorrow onwards
    expect(result).toHaveLength(2);
    
    const scheduleIds = result.map(s => s.id);
    expect(scheduleIds).toContain(testData.schedule2.id); // tomorrow
    expect(scheduleIds).toContain(testData.schedule3.id); // next week
    expect(scheduleIds).not.toContain(testData.schedule1.id); // today (before filter)
  });

  it('should filter by end_date correctly', async () => {
    const testData = await setupTestData();
    
    const query: GetClassSchedulesQuery = {
      end_date: testData.tomorrow
    };
    
    const result = await getClassSchedules(query);
    
    // Should only return schedules starting up to and including tomorrow
    expect(result).toHaveLength(2);
    
    const scheduleIds = result.map(s => s.id);
    expect(scheduleIds).toContain(testData.schedule1.id); // today
    expect(scheduleIds).toContain(testData.schedule2.id); // tomorrow
    expect(scheduleIds).not.toContain(testData.schedule3.id); // next week (after filter)
  });

  it('should filter by class_type correctly', async () => {
    const testData = await setupTestData();
    
    const query: GetClassSchedulesQuery = {
      class_type: 'yoga'
    };
    
    const result = await getClassSchedules(query);
    
    // Should only return yoga class schedules
    expect(result).toHaveLength(2);
    
    const scheduleIds = result.map(s => s.id);
    expect(scheduleIds).toContain(testData.schedule1.id); // yoga today
    expect(scheduleIds).toContain(testData.schedule3.id); // yoga next week
    expect(scheduleIds).not.toContain(testData.schedule2.id); // pilates
  });

  it('should handle combined filters correctly', async () => {
    const testData = await setupTestData();
    
    const query: GetClassSchedulesQuery = {
      start_date: testData.today,
      end_date: testData.tomorrow,
      class_type: 'pilates'
    };
    
    const result = await getClassSchedules(query);
    
    // Should only return pilates schedules within the date range
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(testData.schedule2.id);
    expect(result[0].class_id).toBe(testData.class2Id);
  });

  it('should return empty array when no schedules match filters', async () => {
    await setupTestData();
    
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const query: GetClassSchedulesQuery = {
      start_date: futureDate,
      class_type: 'spinning'
    };
    
    const result = await getClassSchedules(query);
    
    expect(result).toHaveLength(0);
  });

  it('should include cancelled schedules in results', async () => {
    const testData = await setupTestData();
    
    const result = await getClassSchedules();
    
    // Find the cancelled schedule
    const cancelledSchedule = result.find(s => s.id === testData.schedule3.id);
    
    expect(cancelledSchedule).toBeDefined();
    expect(cancelledSchedule!.is_cancelled).toBe(true);
  });

  it('should handle empty database gracefully', async () => {
    const result = await getClassSchedules();
    
    expect(result).toHaveLength(0);
  });

  it('should handle date range filtering with exact boundaries', async () => {
    const testData = await setupTestData();
    
    // Test exact start date boundary
    const query: GetClassSchedulesQuery = {
      start_date: testData.today,
      end_date: testData.today
    };
    
    const result = await getClassSchedules(query);
    
    // Should include schedules that start exactly on the boundary dates
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(testData.schedule1.id);
  });
});
