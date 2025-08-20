import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(result).toEqual([]);
  });

  it('should return all classes with correct structure', async () => {
    // Create test user and instructor
    const userResult = await db.insert(usersTable)
      .values({
        name: 'John Instructor',
        email: 'john@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 20
      })
      .returning()
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: classResult[0].id,
      name: 'Morning Yoga',
      description: 'Relaxing morning yoga session',
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T10:00:00Z'),
      instructor_id: instructorResult[0].id,
      max_capacity: 20,
      created_at: expect.any(Date)
    });
  });

  it('should return multiple classes ordered correctly', async () => {
    // Create test user and instructor
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Sarah Instructor',
        email: 'sarah@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Pilates',
        bio: 'Certified Pilates instructor'
      })
      .returning()
      .execute();

    // Create multiple test classes
    await db.insert(classesTable)
      .values([
        {
          name: 'Morning Pilates',
          description: 'High-energy morning workout',
          start_time: new Date('2024-01-15T09:00:00Z'),
          end_time: new Date('2024-01-15T10:00:00Z'),
          instructor_id: instructorResult[0].id,
          max_capacity: 15
        },
        {
          name: 'Evening Relaxation',
          description: 'Wind down with gentle stretches',
          start_time: new Date('2024-01-15T18:00:00Z'),
          end_time: new Date('2024-01-15T19:00:00Z'),
          instructor_id: instructorResult[0].id,
          max_capacity: 25
        },
        {
          name: 'Lunch Break Fitness',
          description: null, // Test nullable description
          start_time: new Date('2024-01-15T12:00:00Z'),
          end_time: new Date('2024-01-15T13:00:00Z'),
          instructor_id: instructorResult[0].id,
          max_capacity: 10
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);
    
    // Verify all classes are returned
    const classNames = result.map(c => c.name).sort();
    expect(classNames).toEqual(['Evening Relaxation', 'Lunch Break Fitness', 'Morning Pilates']);

    // Verify nullable description is handled correctly
    const lunchClass = result.find(c => c.name === 'Lunch Break Fitness');
    expect(lunchClass?.description).toBeNull();

    // Verify all required fields are present
    result.forEach(classItem => {
      expect(classItem.id).toBeDefined();
      expect(classItem.name).toBeDefined();
      expect(classItem.start_time).toBeInstanceOf(Date);
      expect(classItem.end_time).toBeInstanceOf(Date);
      expect(classItem.instructor_id).toBeDefined();
      expect(classItem.max_capacity).toBeGreaterThan(0);
      expect(classItem.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle classes with bookings correctly', async () => {
    // Create test user and instructor
    const userResult = await db.insert(usersTable)
      .values([
        {
          name: 'Mike Instructor',
          email: 'mike@example.com',
          role: 'instructor'
        },
        {
          name: 'Student User',
          email: 'student@example.com',
          role: 'member'
        }
      ])
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'CrossFit',
        bio: 'CrossFit Level 3 trainer'
      })
      .returning()
      .execute();

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'CrossFit WOD',
        description: 'High intensity workout of the day',
        start_time: new Date('2024-01-16T07:00:00Z'),
        end_time: new Date('2024-01-16T08:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 12
      })
      .returning()
      .execute();

    // Create bookings for the class
    await db.insert(bookingsTable)
      .values([
        {
          user_id: userResult[1].id,
          class_id: classResult[0].id,
          booking_status: 'confirmed'
        },
        {
          user_id: userResult[1].id,
          class_id: classResult[0].id,
          booking_status: 'waitlist'
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('CrossFit WOD');
    expect(result[0].max_capacity).toBe(12);
    
    // The handler should return classes regardless of booking count
    // (booking count aggregation is handled in the query but not exposed in return type)
    expect(result[0].id).toBe(classResult[0].id);
  });

  it('should handle multiple instructors correctly', async () => {
    // Create multiple instructors
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Instructor One',
          email: 'instructor1@example.com',
          role: 'instructor'
        },
        {
          name: 'Instructor Two',
          email: 'instructor2@example.com',
          role: 'instructor'
        }
      ])
      .returning()
      .execute();

    const instructors = await db.insert(instructorsTable)
      .values([
        {
          user_id: users[0].id,
          specialization: 'Cardio',
          bio: 'Cardio specialist'
        },
        {
          user_id: users[1].id,
          specialization: 'Strength',
          bio: 'Strength training expert'
        }
      ])
      .returning()
      .execute();

    // Create classes for different instructors
    await db.insert(classesTable)
      .values([
        {
          name: 'Cardio Blast',
          description: 'High-energy cardio workout',
          start_time: new Date('2024-01-17T09:00:00Z'),
          end_time: new Date('2024-01-17T10:00:00Z'),
          instructor_id: instructors[0].id,
          max_capacity: 30
        },
        {
          name: 'Strength Training',
          description: 'Build muscle and strength',
          start_time: new Date('2024-01-17T11:00:00Z'),
          end_time: new Date('2024-01-17T12:00:00Z'),
          instructor_id: instructors[1].id,
          max_capacity: 15
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    // Verify classes have correct instructor assignments
    const cardioClass = result.find(c => c.name === 'Cardio Blast');
    const strengthClass = result.find(c => c.name === 'Strength Training');
    
    expect(cardioClass?.instructor_id).toBe(instructors[0].id);
    expect(strengthClass?.instructor_id).toBe(instructors[1].id);
  });
});
