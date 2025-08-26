import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable } from '../db/schema';
import { type GetClassByIdInput } from '../schema';
import { getClassById } from '../handlers/get_class_by_id';

describe('getClassById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent class', async () => {
    const input: GetClassByIdInput = {
      id: 999
    };

    const result = await getClassById(input);
    expect(result).toBeNull();
  });

  it('should fetch an existing class by id', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'John Instructor',
        email: 'john@instructor.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create an instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    // Create a class
    const startTime = new Date('2024-01-15T10:00:00Z');
    const endTime = new Date('2024-01-15T11:00:00Z');

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'A relaxing morning yoga session',
        start_time: startTime,
        end_time: endTime,
        instructor_id: instructorResult[0].id,
        max_capacity: 20
      })
      .returning()
      .execute();

    const input: GetClassByIdInput = {
      id: classResult[0].id
    };

    const result = await getClassById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(classResult[0].id);
    expect(result!.name).toEqual('Morning Yoga');
    expect(result!.description).toEqual('A relaxing morning yoga session');
    expect(result!.start_time).toEqual(startTime);
    expect(result!.end_time).toEqual(endTime);
    expect(result!.instructor_id).toEqual(instructorResult[0].id);
    expect(result!.max_capacity).toEqual(20);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return class with null description', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Jane Instructor',
        email: 'jane@instructor.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create an instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Pilates',
        bio: null
      })
      .returning()
      .execute();

    // Create a class without description
    const startTime = new Date('2024-01-16T14:00:00Z');
    const endTime = new Date('2024-01-16T15:00:00Z');

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Pilates Class',
        description: null,
        start_time: startTime,
        end_time: endTime,
        instructor_id: instructorResult[0].id,
        max_capacity: 15
      })
      .returning()
      .execute();

    const input: GetClassByIdInput = {
      id: classResult[0].id
    };

    const result = await getClassById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(classResult[0].id);
    expect(result!.name).toEqual('Pilates Class');
    expect(result!.description).toBeNull();
    expect(result!.start_time).toEqual(startTime);
    expect(result!.end_time).toEqual(endTime);
    expect(result!.instructor_id).toEqual(instructorResult[0].id);
    expect(result!.max_capacity).toEqual(15);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple classes and return correct one', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Multi Instructor',
        email: 'multi@instructor.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create an instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userResult[0].id,
        specialization: 'Multiple',
        bio: 'Multi-discipline instructor'
      })
      .returning()
      .execute();

    // Create multiple classes
    const class1Result = await db.insert(classesTable)
      .values({
        name: 'Class One',
        description: 'First class',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 10
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        name: 'Class Two',
        description: 'Second class',
        start_time: new Date('2024-01-15T11:00:00Z'),
        end_time: new Date('2024-01-15T12:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 25
      })
      .returning()
      .execute();

    // Fetch the second class
    const input: GetClassByIdInput = {
      id: class2Result[0].id
    };

    const result = await getClassById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(class2Result[0].id);
    expect(result!.name).toEqual('Class Two');
    expect(result!.description).toEqual('Second class');
    expect(result!.max_capacity).toEqual(25);
    
    // Ensure we didn't get the first class
    expect(result!.id).not.toEqual(class1Result[0].id);
    expect(result!.name).not.toEqual('Class One');
  });
});
