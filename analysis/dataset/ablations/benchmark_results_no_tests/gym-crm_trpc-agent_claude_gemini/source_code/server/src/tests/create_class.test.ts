import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq, and } from 'drizzle-orm';

// Test input for creating a class
const testInput: CreateClassInput = {
  name: 'Morning Yoga',
  description: 'A relaxing yoga session',
  instructor_name: 'Jane Doe',
  duration_minutes: 60,
  max_capacity: 20,
  class_date: new Date('2024-02-15'),
  start_time: '09:00',
  status: 'scheduled'
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class successfully', async () => {
    const result = await createClass(testInput);

    // Verify returned data structure
    expect(result.name).toEqual('Morning Yoga');
    expect(result.description).toEqual('A relaxing yoga session');
    expect(result.instructor_name).toEqual('Jane Doe');
    expect(result.duration_minutes).toEqual(60);
    expect(result.max_capacity).toEqual(20);
    expect(result.current_bookings).toEqual(0);
    expect(result.class_date).toEqual(new Date('2024-02-15'));
    expect(result.start_time).toEqual('09:00');
    expect(result.status).toEqual('scheduled');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query database to verify persistence
    const savedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(savedClasses).toHaveLength(1);
    const savedClass = savedClasses[0];
    
    expect(savedClass.name).toEqual('Morning Yoga');
    expect(savedClass.description).toEqual('A relaxing yoga session');
    expect(savedClass.instructor_name).toEqual('Jane Doe');
    expect(savedClass.duration_minutes).toEqual(60);
    expect(savedClass.max_capacity).toEqual(20);
    expect(savedClass.current_bookings).toEqual(0);
    expect(savedClass.class_date).toEqual('2024-02-15');
    expect(savedClass.start_time).toEqual('09:00');
    expect(savedClass.status).toEqual('scheduled');
    expect(savedClass.created_at).toBeInstanceOf(Date);
    expect(savedClass.updated_at).toBeInstanceOf(Date);
  });

  it('should create class with null description', async () => {
    const inputWithNullDescription: CreateClassInput = {
      ...testInput,
      description: null
    };

    const result = await createClass(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Morning Yoga');
    expect(result.instructor_name).toEqual('Jane Doe');
  });

  it('should use default status when not provided', async () => {
    const inputWithoutStatus: CreateClassInput = {
      name: 'Evening Pilates',
      description: 'A challenging pilates class',
      instructor_name: 'John Smith',
      duration_minutes: 45,
      max_capacity: 15,
      class_date: new Date('2024-02-16'),
      start_time: '18:00',
      status: 'scheduled' // Since Zod applies defaults during parsing, handler receives this
    };

    const result = await createClass(inputWithoutStatus);

    expect(result.status).toEqual('scheduled');
    expect(result.name).toEqual('Evening Pilates');
  });

  it('should prevent scheduling conflicts for same instructor', async () => {
    // Create first class
    await createClass(testInput);

    // Try to create another class with same instructor, date, and time
    const conflictingInput: CreateClassInput = {
      name: 'Advanced Yoga',
      description: 'For experienced practitioners',
      instructor_name: 'Jane Doe', // Same instructor
      duration_minutes: 90,
      max_capacity: 12,
      class_date: new Date('2024-02-15'), // Same date
      start_time: '09:00', // Same time
      status: 'scheduled'
    };

    await expect(createClass(conflictingInput))
      .rejects.toThrow(/already has a class scheduled/i);
  });

  it('should allow same instructor to have classes at different times', async () => {
    // Create first class
    await createClass(testInput);

    // Create another class with same instructor but different time
    const differentTimeInput: CreateClassInput = {
      name: 'Evening Yoga',
      description: 'End your day with yoga',
      instructor_name: 'Jane Doe', // Same instructor
      duration_minutes: 60,
      max_capacity: 18,
      class_date: new Date('2024-02-15'), // Same date
      start_time: '18:00', // Different time
      status: 'scheduled'
    };

    const result = await createClass(differentTimeInput);

    expect(result.name).toEqual('Evening Yoga');
    expect(result.instructor_name).toEqual('Jane Doe');
    expect(result.start_time).toEqual('18:00');
    expect(result.id).toBeDefined();
  });

  it('should allow same instructor to have classes on different dates', async () => {
    // Create first class
    await createClass(testInput);

    // Create another class with same instructor and time but different date
    const differentDateInput: CreateClassInput = {
      name: 'Weekend Yoga',
      description: 'Saturday morning session',
      instructor_name: 'Jane Doe', // Same instructor
      duration_minutes: 75,
      max_capacity: 25,
      class_date: new Date('2024-02-17'), // Different date
      start_time: '09:00', // Same time
      status: 'scheduled'
    };

    const result = await createClass(differentDateInput);

    expect(result.name).toEqual('Weekend Yoga');
    expect(result.instructor_name).toEqual('Jane Doe');
    expect(result.class_date).toEqual(new Date('2024-02-17'));
    expect(result.start_time).toEqual('09:00');
  });

  it('should allow different instructors to have classes at same time and date', async () => {
    // Create first class
    await createClass(testInput);

    // Create another class with different instructor but same time and date
    const differentInstructorInput: CreateClassInput = {
      name: 'Morning Cardio',
      description: 'High intensity workout',
      instructor_name: 'Mike Johnson', // Different instructor
      duration_minutes: 45,
      max_capacity: 30,
      class_date: new Date('2024-02-15'), // Same date
      start_time: '09:00', // Same time
      status: 'scheduled'
    };

    const result = await createClass(differentInstructorInput);

    expect(result.name).toEqual('Morning Cardio');
    expect(result.instructor_name).toEqual('Mike Johnson');
    expect(result.class_date).toEqual(new Date('2024-02-15'));
    expect(result.start_time).toEqual('09:00');
  });

  it('should handle date conversion correctly', async () => {
    const dateInput: CreateClassInput = {
      name: 'Date Test Class',
      description: 'Testing date handling',
      instructor_name: 'Test Instructor',
      duration_minutes: 30,
      max_capacity: 10,
      class_date: new Date('2024-12-25'),
      start_time: '15:30',
      status: 'scheduled'
    };

    const result = await createClass(dateInput);

    expect(result.class_date).toBeInstanceOf(Date);
    expect(result.class_date.getFullYear()).toEqual(2024);
    expect(result.class_date.getMonth()).toEqual(11); // December is month 11
    expect(result.class_date.getDate()).toEqual(25);

    // Verify in database
    const savedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(savedClasses[0].class_date).toEqual('2024-12-25');
  });
});
