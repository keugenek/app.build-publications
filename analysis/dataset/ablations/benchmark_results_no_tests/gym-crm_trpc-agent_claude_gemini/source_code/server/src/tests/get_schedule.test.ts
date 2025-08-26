import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type GetScheduleInput } from '../schema';
import { getSchedule } from '../handlers/get_schedule';

// Test input for date range
const testInput: GetScheduleInput = {
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-01-20')
};

describe('getSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return classes within date range', async () => {
    // Create test classes - some within range, some outside
    await db.insert(classesTable).values([
      {
        name: 'Yoga Class',
        description: 'Morning yoga session',
        instructor_name: 'Sarah Johnson',
        duration_minutes: 60,
        max_capacity: 20,
        current_bookings: 5,
        class_date: '2024-01-16',
        start_time: '09:00',
        status: 'scheduled'
      },
      {
        name: 'Pilates Class',
        description: 'Core strengthening',
        instructor_name: 'Mike Wilson',
        duration_minutes: 45,
        max_capacity: 15,
        current_bookings: 10,
        class_date: '2024-01-18',
        start_time: '18:30',
        status: 'scheduled'
      },
      {
        name: 'Outside Range Class',
        description: 'This should not appear',
        instructor_name: 'Jane Doe',
        duration_minutes: 30,
        max_capacity: 10,
        current_bookings: 3,
        class_date: '2024-01-25', // Outside date range
        start_time: '10:00',
        status: 'scheduled'
      }
    ]).execute();

    const result = await getSchedule(testInput);

    // Should return only classes within date range
    expect(result).toHaveLength(2);
    
    const yogaClass = result.find(c => c.name === 'Yoga Class');
    expect(yogaClass).toBeDefined();
    expect(yogaClass!.instructor_name).toEqual('Sarah Johnson');
    expect(yogaClass!.duration_minutes).toEqual(60);
    expect(yogaClass!.max_capacity).toEqual(20);
    expect(yogaClass!.current_bookings).toEqual(5);
    expect(yogaClass!.available_spots).toEqual(15); // 20 - 5
    expect(yogaClass!.class_date).toEqual(new Date('2024-01-16'));
    expect(yogaClass!.start_time).toEqual('09:00');
    expect(yogaClass!.status).toEqual('scheduled');

    const pilatesClass = result.find(c => c.name === 'Pilates Class');
    expect(pilatesClass).toBeDefined();
    expect(pilatesClass!.available_spots).toEqual(5); // 15 - 10
    expect(pilatesClass!.class_date).toEqual(new Date('2024-01-18'));
  });

  it('should only return scheduled and in_progress classes', async () => {
    // Create classes with different statuses
    await db.insert(classesTable).values([
      {
        name: 'Scheduled Class',
        instructor_name: 'Instructor A',
        duration_minutes: 60,
        max_capacity: 20,
        current_bookings: 5,
        class_date: '2024-01-16',
        start_time: '09:00',
        status: 'scheduled'
      },
      {
        name: 'In Progress Class',
        instructor_name: 'Instructor B',
        duration_minutes: 45,
        max_capacity: 15,
        current_bookings: 8,
        class_date: '2024-01-17',
        start_time: '10:00',
        status: 'in_progress'
      },
      {
        name: 'Completed Class',
        instructor_name: 'Instructor C',
        duration_minutes: 30,
        max_capacity: 10,
        current_bookings: 7,
        class_date: '2024-01-18',
        start_time: '11:00',
        status: 'completed'
      },
      {
        name: 'Cancelled Class',
        instructor_name: 'Instructor D',
        duration_minutes: 60,
        max_capacity: 25,
        current_bookings: 0,
        class_date: '2024-01-19',
        start_time: '12:00',
        status: 'cancelled'
      }
    ]).execute();

    const result = await getSchedule(testInput);

    // Should return only scheduled and in_progress classes
    expect(result).toHaveLength(2);
    expect(result.map(c => c.name)).toContain('Scheduled Class');
    expect(result.map(c => c.name)).toContain('In Progress Class');
    expect(result.map(c => c.name)).not.toContain('Completed Class');
    expect(result.map(c => c.name)).not.toContain('Cancelled Class');

    const scheduledClass = result.find(c => c.name === 'Scheduled Class');
    expect(scheduledClass!.status).toEqual('scheduled');

    const inProgressClass = result.find(c => c.name === 'In Progress Class');
    expect(inProgressClass!.status).toEqual('in_progress');
  });

  it('should calculate available spots correctly', async () => {
    await db.insert(classesTable).values([
      {
        name: 'Full Class',
        instructor_name: 'Instructor A',
        duration_minutes: 60,
        max_capacity: 10,
        current_bookings: 10,
        class_date: '2024-01-16',
        start_time: '09:00',
        status: 'scheduled'
      },
      {
        name: 'Empty Class',
        instructor_name: 'Instructor B',
        duration_minutes: 45,
        max_capacity: 15,
        current_bookings: 0,
        class_date: '2024-01-17',
        start_time: '10:00',
        status: 'scheduled'
      },
      {
        name: 'Partial Class',
        instructor_name: 'Instructor C',
        duration_minutes: 30,
        max_capacity: 20,
        current_bookings: 7,
        class_date: '2024-01-18',
        start_time: '11:00',
        status: 'scheduled'
      }
    ]).execute();

    const result = await getSchedule(testInput);

    expect(result).toHaveLength(3);
    
    const fullClass = result.find(c => c.name === 'Full Class');
    expect(fullClass!.available_spots).toEqual(0); // 10 - 10

    const emptyClass = result.find(c => c.name === 'Empty Class');
    expect(emptyClass!.available_spots).toEqual(15); // 15 - 0

    const partialClass = result.find(c => c.name === 'Partial Class');
    expect(partialClass!.available_spots).toEqual(13); // 20 - 7
  });

  it('should return empty array when no classes in date range', async () => {
    // Create class outside the date range
    await db.insert(classesTable).values({
      name: 'Future Class',
      instructor_name: 'Instructor A',
      duration_minutes: 60,
      max_capacity: 20,
      current_bookings: 5,
      class_date: '2024-02-01', // Outside date range
      start_time: '09:00',
      status: 'scheduled'
    }).execute();

    const result = await getSchedule(testInput);

    expect(result).toHaveLength(0);
  });

  it('should handle edge dates correctly', async () => {
    // Create classes on the exact start and end dates
    await db.insert(classesTable).values([
      {
        name: 'Start Date Class',
        instructor_name: 'Instructor A',
        duration_minutes: 60,
        max_capacity: 20,
        current_bookings: 5,
        class_date: '2024-01-15', // Exact start date
        start_time: '09:00',
        status: 'scheduled'
      },
      {
        name: 'End Date Class',
        instructor_name: 'Instructor B',
        duration_minutes: 45,
        max_capacity: 15,
        current_bookings: 8,
        class_date: '2024-01-20', // Exact end date
        start_time: '18:00',
        status: 'scheduled'
      }
    ]).execute();

    const result = await getSchedule(testInput);

    expect(result).toHaveLength(2);
    expect(result.map(c => c.name)).toContain('Start Date Class');
    expect(result.map(c => c.name)).toContain('End Date Class');
  });

  it('should handle classes with null description', async () => {
    await db.insert(classesTable).values({
      name: 'No Description Class',
      description: null,
      instructor_name: 'Instructor A',
      duration_minutes: 60,
      max_capacity: 20,
      current_bookings: 5,
      class_date: '2024-01-16',
      start_time: '09:00',
      status: 'scheduled'
    }).execute();

    const result = await getSchedule(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('No Description Class');
    expect(result[0].description).toBeNull();
  });
});
