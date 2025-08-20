import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  name: 'Test Instructor User',
  email: 'instructor@test.com',
  role: 'instructor' as const
};

const testInstructor = {
  user_id: 1, // Will be set after user creation
  specialization: 'Yoga',
  bio: 'Experienced yoga instructor'
};

const testClassInput: CreateClassInput = {
  name: 'Morning Yoga',
  description: 'A relaxing morning yoga session',
  start_time: new Date('2024-01-15T08:00:00Z'),
  end_time: new Date('2024-01-15T09:00:00Z'),
  instructor_id: 1, // Will be set after instructor creation
  max_capacity: 20
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class successfully', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    const classInput = { ...testClassInput, instructor_id: instructorResult[0].id };
    const result = await createClass(classInput);

    // Basic field validation
    expect(result.name).toEqual('Morning Yoga');
    expect(result.description).toEqual('A relaxing morning yoga session');
    expect(result.start_time).toEqual(testClassInput.start_time);
    expect(result.end_time).toEqual(testClassInput.end_time);
    expect(result.instructor_id).toEqual(instructorResult[0].id);
    expect(result.max_capacity).toEqual(20);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    const classInput = { ...testClassInput, instructor_id: instructorResult[0].id };
    const result = await createClass(classInput);

    // Verify class was saved to database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Morning Yoga');
    expect(classes[0].description).toEqual('A relaxing morning yoga session');
    expect(classes[0].instructor_id).toEqual(instructorResult[0].id);
    expect(classes[0].max_capacity).toEqual(20);
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create class with null description', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    const classInputWithoutDescription: CreateClassInput = { 
      name: testClassInput.name,
      start_time: testClassInput.start_time,
      end_time: testClassInput.end_time,
      instructor_id: instructorResult[0].id,
      max_capacity: testClassInput.max_capacity
      // description omitted to test null handling
    };
    const result = await createClass(classInputWithoutDescription);

    expect(result.description).toBeNull();

    // Verify in database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes[0].description).toBeNull();
  });

  it('should throw error when instructor does not exist', async () => {
    const classInput = { ...testClassInput, instructor_id: 999 };

    await expect(createClass(classInput)).rejects.toThrow(/instructor not found/i);
  });

  it('should throw error when start_time is after end_time', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    const classInput = {
      ...testClassInput,
      instructor_id: instructorResult[0].id,
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T08:00:00Z') // End before start
    };

    await expect(createClass(classInput)).rejects.toThrow(/start time must be before end time/i);
  });

  it('should throw error when start_time equals end_time', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    const sameTime = new Date('2024-01-15T08:00:00Z');
    const classInput = {
      ...testClassInput,
      instructor_id: instructorResult[0].id,
      start_time: sameTime,
      end_time: sameTime
    };

    await expect(createClass(classInput)).rejects.toThrow(/start time must be before end time/i);
  });

  it('should throw error when instructor has scheduling conflict', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    // Create existing class
    const existingClass = {
      name: 'Existing Class',
      description: 'Already scheduled',
      start_time: new Date('2024-01-15T08:30:00Z'),
      end_time: new Date('2024-01-15T09:30:00Z'),
      instructor_id: instructorResult[0].id,
      max_capacity: 15
    };

    await db.insert(classesTable)
      .values(existingClass)
      .execute();

    // Try to create overlapping class
    const overlappingClass = {
      ...testClassInput,
      instructor_id: instructorResult[0].id,
      start_time: new Date('2024-01-15T08:00:00Z'),
      end_time: new Date('2024-01-15T09:00:00Z') // Overlaps with existing class
    };

    await expect(createClass(overlappingClass)).rejects.toThrow(/scheduling conflict/i);
  });

  it('should allow classes with different instructors at same time', async () => {
    // Create first user and instructor
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructor1Result = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: user1Result[0].id })
      .returning()
      .execute();

    // Create second user and instructor
    const user2Result = await db.insert(usersTable)
      .values({ ...testUser, email: 'instructor2@test.com' })
      .returning()
      .execute();

    const instructor2Result = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: user2Result[0].id, specialization: 'Pilates' })
      .returning()
      .execute();

    // Create first class
    const class1Input = { ...testClassInput, instructor_id: instructor1Result[0].id };
    const result1 = await createClass(class1Input);

    // Create second class with different instructor at same time
    const class2Input = {
      ...testClassInput,
      name: 'Morning Pilates',
      instructor_id: instructor2Result[0].id
    };
    const result2 = await createClass(class2Input);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.instructor_id).not.toEqual(result2.instructor_id);
  });

  it('should allow non-overlapping classes for same instructor', async () => {
    // Create prerequisite user and instructor
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({ ...testInstructor, user_id: userResult[0].id })
      .returning()
      .execute();

    // Create first class
    const class1Input = { ...testClassInput, instructor_id: instructorResult[0].id };
    const result1 = await createClass(class1Input);

    // Create second class after first ends
    const class2Input = {
      ...testClassInput,
      name: 'Afternoon Yoga',
      instructor_id: instructorResult[0].id,
      start_time: new Date('2024-01-15T10:00:00Z'),
      end_time: new Date('2024-01-15T11:00:00Z')
    };
    const result2 = await createClass(class2Input);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Morning Yoga');
    expect(result2.name).toEqual('Afternoon Yoga');
  });
});
