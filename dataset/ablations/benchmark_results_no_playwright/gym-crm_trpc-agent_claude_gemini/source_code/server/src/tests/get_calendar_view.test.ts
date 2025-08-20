import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { getCalendarView } from '../handlers/get_calendar_view';

describe('getCalendarView', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes are scheduled', async () => {
    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-01-07');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toEqual([]);
  });

  it('should return classes grouped by date within date range', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    // Create class schedules for different dates
    await db.insert(classSchedulesTable)
      .values([
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          current_bookings: 5
        },
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-16',
          start_time: '10:00',
          end_time: '11:00',
          current_bookings: 8
        }
      ])
      .execute();

    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-01-31');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[0].classes).toHaveLength(1);
    expect(result[0].classes[0].class_name).toEqual('Morning Yoga');
    expect(result[0].classes[0].instructor_name).toEqual('Jane Smith');
    expect(result[0].classes[0].start_time).toEqual('09:00');
    expect(result[0].classes[0].current_bookings).toEqual(5);
    expect(result[0].classes[0].max_capacity).toEqual(20);

    expect(result[1].date).toEqual('2024-01-16');
    expect(result[1].classes[0].current_bookings).toEqual(8);
  });

  it('should include multiple classes on the same date', async () => {
    // Create test classes
    const [yogaClass] = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    const [cardioClass] = await db.insert(classesTable)
      .values({
        name: 'HIIT Cardio',
        instructor_name: 'Mike Johnson',
        duration_minutes: 45,
        max_capacity: 15,
        class_type: 'cardio',
        difficulty_level: 'intermediate'
      })
      .returning()
      .execute();

    // Create schedules for same date
    await db.insert(classSchedulesTable)
      .values([
        {
          class_id: yogaClass.id,
          scheduled_date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00',
          current_bookings: 12
        },
        {
          class_id: cardioClass.id,
          scheduled_date: '2024-01-15',
          start_time: '11:00',
          end_time: '11:45',
          current_bookings: 10
        }
      ])
      .execute();

    const dateFrom = new Date('2024-01-15');
    const dateTo = new Date('2024-01-15');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[0].classes).toHaveLength(2);
    
    // Check both classes are present
    const classNames = result[0].classes.map(c => c.class_name);
    expect(classNames).toContain('Morning Yoga');
    expect(classNames).toContain('HIIT Cardio');
  });

  it('should only return classes within specified date range', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        instructor_name: 'Instructor',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'strength',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    // Create schedules - some within range, some outside
    await db.insert(classSchedulesTable)
      .values([
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-10', // Before range
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-15', // Within range
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-20', // Within range
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-25', // After range
          start_time: '09:00',
          end_time: '10:00'
        }
      ])
      .execute();

    const dateFrom = new Date('2024-01-15');
    const dateTo = new Date('2024-01-20');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[1].date).toEqual('2024-01-20');
  });

  it('should include cancellation information', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Cancelled Class',
        instructor_name: 'Instructor',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'pilates',
        difficulty_level: 'intermediate'
      })
      .returning()
      .execute();

    // Create cancelled schedule
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

    const dateFrom = new Date('2024-01-15');
    const dateTo = new Date('2024-01-15');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toHaveLength(1);
    expect(result[0].classes[0].is_cancelled).toBe(true);
    expect(result[0].classes[0].cancellation_reason).toEqual('Instructor unavailable');
  });

  it('should return results sorted by date', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        instructor_name: 'Instructor',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'dance',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    // Create schedules in random order
    await db.insert(classSchedulesTable)
      .values([
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-20',
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-15',
          start_time: '09:00',
          end_time: '10:00'
        },
        {
          class_id: testClass.id,
          scheduled_date: '2024-01-18',
          start_time: '09:00',
          end_time: '10:00'
        }
      ])
      .execute();

    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-01-31');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[1].date).toEqual('2024-01-18');
    expect(result[2].date).toEqual('2024-01-20');
  });

  it('should include all required class information', async () => {
    // Create test class with all fields
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Advanced Martial Arts',
        description: 'High-intensity training',
        instructor_name: 'Master Wong',
        duration_minutes: 90,
        max_capacity: 12,
        class_type: 'martial_arts',
        difficulty_level: 'advanced'
      })
      .returning()
      .execute();

    // Create schedule
    const [schedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: '2024-01-15',
        start_time: '18:30',
        end_time: '20:00',
        current_bookings: 8
      })
      .returning()
      .execute();

    const dateFrom = new Date('2024-01-15');
    const dateTo = new Date('2024-01-15');

    const result = await getCalendarView(dateFrom, dateTo);

    expect(result).toHaveLength(1);
    const classData = result[0].classes[0];
    
    expect(classData.schedule_id).toEqual(schedule.id);
    expect(classData.class_id).toEqual(testClass.id);
    expect(classData.class_name).toEqual('Advanced Martial Arts');
    expect(classData.instructor_name).toEqual('Master Wong');
    expect(classData.start_time).toEqual('18:30');
    expect(classData.end_time).toEqual('20:00');
    expect(classData.duration_minutes).toEqual(90);
    expect(classData.current_bookings).toEqual(8);
    expect(classData.max_capacity).toEqual(12);
    expect(classData.class_type).toEqual('martial_arts');
    expect(classData.difficulty_level).toEqual('advanced');
    expect(classData.is_cancelled).toBe(false);
    expect(classData.cancellation_reason).toBeNull();
  });
});
