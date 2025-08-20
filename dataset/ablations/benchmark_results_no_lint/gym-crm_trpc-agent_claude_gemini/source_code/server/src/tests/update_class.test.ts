import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable } from '../db/schema';
import { type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Instructor One', email: 'instructor1@test.com', role: 'instructor' },
        { name: 'Instructor Two', email: 'instructor2@test.com', role: 'instructor' },
        { name: 'Member One', email: 'member1@test.com', role: 'member' }
      ])
      .returning()
      .execute();

    // Create instructors
    const instructors = await db.insert(instructorsTable)
      .values([
        { user_id: users[0].id, specialization: 'Yoga', bio: 'Yoga expert' },
        { user_id: users[1].id, specialization: 'Pilates', bio: 'Pilates expert' }
      ])
      .returning()
      .execute();

    // Create a test class
    const classes = await db.insert(classesTable)
      .values([
        {
          name: 'Original Class',
          description: 'Original description',
          start_time: new Date('2024-01-15T10:00:00Z'),
          end_time: new Date('2024-01-15T11:00:00Z'),
          instructor_id: instructors[0].id,
          max_capacity: 20
        },
        {
          name: 'Conflict Class',
          description: 'For conflict testing',
          start_time: new Date('2024-01-15T10:30:00Z'),
          end_time: new Date('2024-01-15T11:30:00Z'),
          instructor_id: instructors[0].id,
          max_capacity: 15
        }
      ])
      .returning()
      .execute();

    return { users, instructors, classes };
  };

  it('should update a class with valid input', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Class Name',
      description: 'Updated description',
      max_capacity: 25
    };

    const result = await updateClass(updateInput);

    expect(result.id).toBe(classId);
    expect(result.name).toBe('Updated Class Name');
    expect(result.description).toBe('Updated description');
    expect(result.max_capacity).toBe(25);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;
    const originalClass = classes[0];

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'New Name Only'
    };

    const result = await updateClass(updateInput);

    expect(result.name).toBe('New Name Only');
    expect(result.description).toBe(originalClass.description);
    expect(result.max_capacity).toBe(originalClass.max_capacity);
    expect(result.instructor_id).toBe(originalClass.instructor_id);
  });

  it('should update class schedule times', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    const newStartTime = new Date('2024-01-16T14:00:00Z');
    const newEndTime = new Date('2024-01-16T15:00:00Z');

    const updateInput: UpdateClassInput = {
      id: classId,
      start_time: newStartTime,
      end_time: newEndTime
    };

    const result = await updateClass(updateInput);

    expect(result.start_time).toEqual(newStartTime);
    expect(result.end_time).toEqual(newEndTime);
  });

  it('should update instructor assignment', async () => {
    const { instructors, classes } = await createTestData();
    const classId = classes[0].id;
    const newInstructorId = instructors[1].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      instructor_id: newInstructorId
    };

    const result = await updateClass(updateInput);

    expect(result.instructor_id).toBe(newInstructorId);
  });

  it('should persist changes to database', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Database Update Test',
      max_capacity: 30
    };

    await updateClass(updateInput);

    // Verify changes were persisted
    const updatedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(updatedClasses).toHaveLength(1);
    expect(updatedClasses[0].name).toBe('Database Update Test');
    expect(updatedClasses[0].max_capacity).toBe(30);
  });

  it('should throw error for non-existent class', async () => {
    const updateInput: UpdateClassInput = {
      id: 99999,
      name: 'Non-existent Class'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Class with id 99999 not found/i);
  });

  it('should throw error for non-existent instructor', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      instructor_id: 99999
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Instructor with id 99999 not found/i);
  });

  it('should throw error when start_time is after end_time', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      start_time: new Date('2024-01-16T15:00:00Z'),
      end_time: new Date('2024-01-16T14:00:00Z')
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Start time must be before end time/i);
  });

  it('should throw error for scheduling conflicts', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    // Try to update class to conflict with existing class time
    const updateInput: UpdateClassInput = {
      id: classId,
      start_time: new Date('2024-01-15T10:45:00Z'), // Overlaps with conflict class
      end_time: new Date('2024-01-15T11:15:00Z')
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Scheduling conflict/i);
  });

  it('should prevent capacity reduction below confirmed bookings', async () => {
    const { users, classes } = await createTestData();
    const classId = classes[0].id;

    // Create confirmed bookings
    await db.insert(bookingsTable)
      .values([
        { user_id: users[2].id, class_id: classId, booking_status: 'confirmed' },
        { user_id: users[0].id, class_id: classId, booking_status: 'confirmed' },
        { user_id: users[1].id, class_id: classId, booking_status: 'cancelled' } // This shouldn't count
      ])
      .execute();

    // Try to reduce capacity below confirmed bookings count (2)
    const updateInput: UpdateClassInput = {
      id: classId,
      max_capacity: 1
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Cannot reduce capacity to 1. There are 2 confirmed bookings/i);
  });

  it('should allow capacity reduction to exact confirmed bookings count', async () => {
    const { users, classes } = await createTestData();
    const classId = classes[0].id;

    // Create confirmed bookings
    await db.insert(bookingsTable)
      .values([
        { user_id: users[2].id, class_id: classId, booking_status: 'confirmed' },
        { user_id: users[0].id, class_id: classId, booking_status: 'confirmed' }
      ])
      .execute();

    // Reduce capacity to match confirmed bookings count
    const updateInput: UpdateClassInput = {
      id: classId,
      max_capacity: 2
    };

    const result = await updateClass(updateInput);
    expect(result.max_capacity).toBe(2);
  });

  it('should handle nullable description field', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      description: null
    };

    const result = await updateClass(updateInput);

    expect(result.description).toBeNull();
  });

  it('should allow scheduling non-conflicting times', async () => {
    const { classes } = await createTestData();
    const classId = classes[0].id;

    // Schedule at a non-conflicting time
    const updateInput: UpdateClassInput = {
      id: classId,
      start_time: new Date('2024-01-16T09:00:00Z'),
      end_time: new Date('2024-01-16T10:00:00Z')
    };

    const result = await updateClass(updateInput);

    expect(result.start_time).toEqual(new Date('2024-01-16T09:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-16T10:00:00Z'));
  });
});
