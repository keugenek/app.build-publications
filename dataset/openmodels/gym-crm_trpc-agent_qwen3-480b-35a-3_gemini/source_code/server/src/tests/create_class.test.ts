import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, instructorsTable } from '../db/schema';
import { type CreateClassInput, type CreateInstructorInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input for creating an instructor first (needed for foreign key)
const testInstructorInput: CreateInstructorInput = {
  name: 'Test Instructor',
  email: 'instructor@test.com'
};

// Test input for creating a class
const testInput: CreateClassInput = {
  name: 'Test Class',
  description: 'A class for testing',
  date: new Date('2024-12-31T10:00:00Z'),
  duration_minutes: 60,
  instructor_id: 0, // Will be set after creating instructor
  capacity: 20
};

describe('createClass', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create an instructor first to satisfy foreign key constraint
    const instructorResult = await db.insert(instructorsTable)
      .values(testInstructorInput)
      .returning()
      .execute();
    
    // Set the instructor_id in our test input
    testInput.instructor_id = instructorResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a class', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Class');
    expect(result.description).toEqual(testInput.description);
    expect(result.date).toEqual(testInput.date);
    expect(result.duration_minutes).toEqual(60);
    expect(result.instructor_id).toEqual(testInput.instructor_id);
    expect(result.capacity).toEqual(20);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Test Class');
    expect(classes[0].description).toEqual(testInput.description);
    expect(classes[0].date).toEqual(testInput.date);
    expect(classes[0].duration_minutes).toEqual(60);
    expect(classes[0].instructor_id).toEqual(testInput.instructor_id);
    expect(classes[0].capacity).toEqual(20);
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle class with null description', async () => {
    const inputWithoutDescription: CreateClassInput = {
      name: 'Class Without Description',
      description: null,
      date: new Date('2024-12-31T11:00:00Z'),
      duration_minutes: 45,
      instructor_id: testInput.instructor_id,
      capacity: 15
    };

    const result = await createClass(inputWithoutDescription);

    expect(result.name).toEqual('Class Without Description');
    expect(result.description).toBeNull();
    expect(result.duration_minutes).toEqual(45);
    expect(result.capacity).toEqual(15);
  });
});
