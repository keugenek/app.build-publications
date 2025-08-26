import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, instructorsTable } from '../db/schema';
import { type UpdateClassInput, type CreateInstructorInput, type CreateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Helper function to create an instructor
const createInstructor = async (input: CreateInstructorInput) => {
  const result = await db.insert(instructorsTable)
    .values(input)
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a class
const createClass = async (input: CreateClassInput) => {
  const result = await db.insert(classesTable)
    .values(input)
    .returning()
    .execute();
  return result[0];
};

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a class name', async () => {
    // Create prerequisite data
    const instructor = await createInstructor({
      name: 'Test Instructor',
      email: 'instructor@test.com'
    });

    const initialClass = await createClass({
      name: 'Original Class',
      description: 'Original description',
      date: new Date('2023-12-01T10:00:00Z'),
      duration_minutes: 60,
      instructor_id: instructor.id,
      capacity: 10
    });

    // Update the class name
    const updateInput: UpdateClassInput = {
      id: initialClass.id,
      name: 'Updated Class Name'
    };

    const result = await updateClass(updateInput);

    // Validate the response
    expect(result.id).toEqual(initialClass.id);
    expect(result.name).toEqual('Updated Class Name');
    expect(result.description).toEqual(initialClass.description);
    expect(result.date).toEqual(initialClass.date);
    expect(result.duration_minutes).toEqual(initialClass.duration_minutes);
    expect(result.instructor_id).toEqual(initialClass.instructor_id);
    expect(result.capacity).toEqual(initialClass.capacity);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple class fields', async () => {
    // Create prerequisite data
    const instructor1 = await createInstructor({
      name: 'Test Instructor 1',
      email: 'instructor1@test.com'
    });

    const instructor2 = await createInstructor({
      name: 'Test Instructor 2',
      email: 'instructor2@test.com'
    });

    const initialClass = await createClass({
      name: 'Original Class',
      description: 'Original description',
      date: new Date('2023-12-01T10:00:00Z'),
      duration_minutes: 60,
      instructor_id: instructor1.id,
      capacity: 10
    });

    // Update multiple fields
    const updateInput: UpdateClassInput = {
      id: initialClass.id,
      description: 'Updated description',
      duration_minutes: 90,
      instructor_id: instructor2.id,
      capacity: 20
    };

    const result = await updateClass(updateInput);

    // Validate the response
    expect(result.id).toEqual(initialClass.id);
    expect(result.name).toEqual(initialClass.name); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.date).toEqual(initialClass.date); // Should remain unchanged
    expect(result.duration_minutes).toEqual(90);
    expect(result.instructor_id).toEqual(instructor2.id);
    expect(result.capacity).toEqual(20);
  });

  it('should save updated class to database', async () => {
    // Create prerequisite data
    const instructor = await createInstructor({
      name: 'Test Instructor',
      email: 'instructor@test.com'
    });

    const initialClass = await createClass({
      name: 'Original Class',
      description: 'Original description',
      date: new Date('2023-12-01T10:00:00Z'),
      duration_minutes: 60,
      instructor_id: instructor.id,
      capacity: 10
    });

    // Update the class
    const updateInput: UpdateClassInput = {
      id: initialClass.id,
      name: 'Database Updated Class',
      capacity: 15
    };

    await updateClass(updateInput);

    // Query the database to verify the update was saved
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, initialClass.id))
      .execute();

    expect(classes).toHaveLength(1);
    const updatedClass = classes[0];
    expect(updatedClass.name).toEqual('Database Updated Class');
    expect(updatedClass.description).toEqual(initialClass.description); // Should be unchanged
    expect(updatedClass.capacity).toEqual(15);
    expect(updatedClass.created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non-existent class', async () => {
    const updateInput: UpdateClassInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Class'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Class with id 99999 not found/);
  });
});
