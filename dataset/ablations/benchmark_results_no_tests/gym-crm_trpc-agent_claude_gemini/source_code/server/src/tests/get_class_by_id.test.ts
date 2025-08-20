import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { getClassById } from '../handlers/get_class_by_id';

describe('getClassById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testClassData = {
    name: 'Yoga Basics',
    description: 'Beginner-friendly yoga class',
    instructor_name: 'Jane Smith',
    duration_minutes: 60,
    max_capacity: 20,
    current_bookings: 5,
    class_date: '2024-01-15',
    start_time: '09:00',
    status: 'scheduled' as const
  };

  it('should return class when it exists', async () => {
    // Create a test class
    const inserted = await db.insert(classesTable)
      .values(testClassData)
      .returning()
      .execute();

    const classId = inserted[0].id;

    // Get the class by ID
    const result = await getClassById(classId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(classId);
    expect(result!.name).toBe('Yoga Basics');
    expect(result!.description).toBe('Beginner-friendly yoga class');
    expect(result!.instructor_name).toBe('Jane Smith');
    expect(result!.duration_minutes).toBe(60);
    expect(result!.max_capacity).toBe(20);
    expect(result!.current_bookings).toBe(5);
    expect(result!.class_date).toEqual(new Date('2024-01-15'));
    expect(result!.start_time).toBe('09:00:00');
    expect(result!.status).toBe('scheduled');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when class does not exist', async () => {
    const result = await getClassById(999);
    expect(result).toBeNull();
  });

  it('should handle class with null description', async () => {
    // Create a class with null description
    const classWithNullDescription = {
      ...testClassData,
      description: null
    };

    const inserted = await db.insert(classesTable)
      .values(classWithNullDescription)
      .returning()
      .execute();

    const classId = inserted[0].id;
    const result = await getClassById(classId);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.name).toBe('Yoga Basics');
  });

  it('should handle different class statuses', async () => {
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
    
    for (const status of statuses) {
      const classWithStatus = {
        ...testClassData,
        name: `Class ${status}`,
        status
      };

      const inserted = await db.insert(classesTable)
        .values(classWithStatus)
        .returning()
        .execute();

      const result = await getClassById(inserted[0].id);
      
      expect(result).not.toBeNull();
      expect(result!.status).toBe(status);
      expect(result!.name).toBe(`Class ${status}`);
    }
  });

  it('should handle various time formats', async () => {
    const classWithTimeFormat = {
      ...testClassData,
      start_time: '14:30',
      name: 'Afternoon Class'
    };

    const inserted = await db.insert(classesTable)
      .values(classWithTimeFormat)
      .returning()
      .execute();

    const result = await getClassById(inserted[0].id);

    expect(result).not.toBeNull();
    expect(result!.start_time).toBe('14:30:00');
    expect(result!.name).toBe('Afternoon Class');
  });

  it('should handle edge case with zero bookings', async () => {
    const classWithZeroBookings = {
      ...testClassData,
      current_bookings: 0,
      name: 'Empty Class'
    };

    const inserted = await db.insert(classesTable)
      .values(classWithZeroBookings)
      .returning()
      .execute();

    const result = await getClassById(inserted[0].id);

    expect(result).not.toBeNull();
    expect(result!.current_bookings).toBe(0);
    expect(result!.name).toBe('Empty Class');
  });

  it('should handle class at maximum capacity', async () => {
    const classAtCapacity = {
      ...testClassData,
      max_capacity: 10,
      current_bookings: 10,
      name: 'Full Class'
    };

    const inserted = await db.insert(classesTable)
      .values(classAtCapacity)
      .returning()
      .execute();

    const result = await getClassById(inserted[0].id);

    expect(result).not.toBeNull();
    expect(result!.max_capacity).toBe(10);
    expect(result!.current_bookings).toBe(10);
    expect(result!.name).toBe('Full Class');
  });
});
