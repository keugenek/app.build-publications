import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable } from '../db/schema';
import { type GetClassesDateRangeInput } from '../schema';
import { getClassesByDateRange } from '../handlers/get_classes_by_date_range';

describe('getClassesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return classes within date range', async () => {
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

    // Create test classes with different dates
    const baseDate = new Date('2024-03-15T10:00:00Z');
    const insideRangeDate1 = new Date('2024-03-16T10:00:00Z');
    const insideRangeDate2 = new Date('2024-03-18T14:00:00Z');
    const outsideRangeDate = new Date('2024-03-25T10:00:00Z');

    await db.insert(classesTable)
      .values([
        {
          name: 'Morning Yoga',
          description: 'Relaxing morning session',
          start_time: baseDate,
          end_time: new Date(baseDate.getTime() + 60 * 60 * 1000), // 1 hour later
          instructor_id: instructorResult[0].id,
          max_capacity: 15
        },
        {
          name: 'Afternoon Flow',
          description: 'Dynamic afternoon class',
          start_time: insideRangeDate1,
          end_time: new Date(insideRangeDate1.getTime() + 90 * 60 * 1000), // 1.5 hours later
          instructor_id: instructorResult[0].id,
          max_capacity: 20
        },
        {
          name: 'Evening Meditation',
          description: 'Peaceful evening session',
          start_time: insideRangeDate2,
          end_time: new Date(insideRangeDate2.getTime() + 45 * 60 * 1000), // 45 minutes later
          instructor_id: instructorResult[0].id,
          max_capacity: 10
        },
        {
          name: 'Future Class',
          description: 'Class outside range',
          start_time: outsideRangeDate,
          end_time: new Date(outsideRangeDate.getTime() + 60 * 60 * 1000),
          instructor_id: instructorResult[0].id,
          max_capacity: 12
        }
      ])
      .execute();

    const input: GetClassesDateRangeInput = {
      start_date: new Date('2024-03-15T00:00:00Z'),
      end_date: new Date('2024-03-20T23:59:59Z')
    };

    const result = await getClassesByDateRange(input);

    // Should return 3 classes within the date range
    expect(result).toHaveLength(3);
    
    // Check that all returned classes are within the date range
    result.forEach(classItem => {
      expect(classItem.start_time >= input.start_date).toBe(true);
      expect(classItem.start_time <= input.end_date).toBe(true);
      expect(classItem.id).toBeDefined();
      expect(classItem.name).toBeDefined();
      expect(classItem.instructor_id).toEqual(instructorResult[0].id);
      expect(classItem.created_at).toBeInstanceOf(Date);
    });

    // Verify specific classes are included
    const classNames = result.map(c => c.name);
    expect(classNames).toContain('Morning Yoga');
    expect(classNames).toContain('Afternoon Flow');
    expect(classNames).toContain('Evening Meditation');
    expect(classNames).not.toContain('Future Class');
  });

  it('should return empty array when no classes in date range', async () => {
    // Create test user and instructor
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Jane Instructor',
        email: 'jane@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Pilates'
      })
      .returning()
      .execute();

    // Create class outside the search range
    await db.insert(classesTable)
      .values({
        name: 'Future Class',
        description: 'Class far in the future',
        start_time: new Date('2025-01-01T10:00:00Z'),
        end_time: new Date('2025-01-01T11:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 15
      })
      .execute();

    const input: GetClassesDateRangeInput = {
      start_date: new Date('2024-03-01T00:00:00Z'),
      end_date: new Date('2024-03-31T23:59:59Z')
    };

    const result = await getClassesByDateRange(input);

    expect(result).toHaveLength(0);
  });

  it('should handle edge case where start_date equals end_date', async () => {
    // Create test user and instructor
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Edge Test Instructor',
        email: 'edge@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Testing'
      })
      .returning()
      .execute();

    const exactDate = new Date('2024-03-15T10:00:00Z');

    // Create class exactly on the search date
    await db.insert(classesTable)
      .values({
        name: 'Exact Date Class',
        description: 'Class on exact date',
        start_time: exactDate,
        end_time: new Date(exactDate.getTime() + 60 * 60 * 1000),
        instructor_id: instructorResult[0].id,
        max_capacity: 10
      })
      .execute();

    const input: GetClassesDateRangeInput = {
      start_date: exactDate,
      end_date: exactDate
    };

    const result = await getClassesByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Exact Date Class');
    expect(result[0].start_time).toEqual(exactDate);
  });

  it('should handle multiple classes at same time', async () => {
    // Create test user and instructor
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Multi Instructor',
        email: 'multi@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Multi-class'
      })
      .returning()
      .execute();

    const sameStartTime = new Date('2024-03-15T10:00:00Z');

    // Create multiple classes with same start time (different rooms/instructors scenario)
    await db.insert(classesTable)
      .values([
        {
          name: 'Class A',
          description: 'First parallel class',
          start_time: sameStartTime,
          end_time: new Date(sameStartTime.getTime() + 60 * 60 * 1000),
          instructor_id: instructorResult[0].id,
          max_capacity: 10
        },
        {
          name: 'Class B',
          description: 'Second parallel class',
          start_time: sameStartTime,
          end_time: new Date(sameStartTime.getTime() + 60 * 60 * 1000),
          instructor_id: instructorResult[0].id,
          max_capacity: 15
        }
      ])
      .execute();

    const input: GetClassesDateRangeInput = {
      start_date: new Date('2024-03-15T00:00:00Z'),
      end_date: new Date('2024-03-15T23:59:59Z')
    };

    const result = await getClassesByDateRange(input);

    expect(result).toHaveLength(2);
    
    const classNames = result.map(c => c.name).sort();
    expect(classNames).toEqual(['Class A', 'Class B']);
    
    // Both should have the same start time
    result.forEach(classItem => {
      expect(classItem.start_time).toEqual(sameStartTime);
    });
  });
});
