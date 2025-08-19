import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, classSchedulesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { deleteClass } from '../handlers/delete_class';
import { eq } from 'drizzle-orm';

// Test input for creating a class
const testClassInput: CreateClassInput = {
  name: 'Test Yoga Class',
  description: 'A relaxing yoga session',
  class_type: 'yoga',
  instructor_name: 'Jane Smith',
  max_capacity: 20,
  duration_minutes: 60,
  price: 25.00
};

describe('deleteClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should hard delete a class when no schedules exist', async () => {
    // Create a test class
    const createdClass = await db.insert(classesTable)
      .values({
        name: testClassInput.name,
        description: testClassInput.description,
        class_type: testClassInput.class_type,
        instructor_name: testClassInput.instructor_name,
        max_capacity: testClassInput.max_capacity,
        duration_minutes: testClassInput.duration_minutes,
        price: testClassInput.price.toString()
      })
      .returning()
      .execute();

    const classId = createdClass[0].id;

    // Delete the class
    const result = await deleteClass(classId);

    expect(result.success).toBe(true);

    // Verify class is completely removed from database
    const deletedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(deletedClass).toHaveLength(0);
  });

  it('should soft delete a class when schedules exist', async () => {
    // Create a test class
    const createdClass = await db.insert(classesTable)
      .values({
        name: testClassInput.name,
        description: testClassInput.description,
        class_type: testClassInput.class_type,
        instructor_name: testClassInput.instructor_name,
        max_capacity: testClassInput.max_capacity,
        duration_minutes: testClassInput.duration_minutes,
        price: testClassInput.price.toString()
      })
      .returning()
      .execute();

    const classId = createdClass[0].id;

    // Create a schedule for this class
    const scheduleStart = new Date();
    scheduleStart.setDate(scheduleStart.getDate() + 7); // One week from now
    const scheduleEnd = new Date(scheduleStart);
    scheduleEnd.setMinutes(scheduleEnd.getMinutes() + testClassInput.duration_minutes);

    await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        start_time: scheduleStart,
        end_time: scheduleEnd,
        room_name: 'Studio A'
      })
      .execute();

    // Delete the class
    const result = await deleteClass(classId);

    expect(result.success).toBe(true);

    // Verify class still exists but is marked as inactive
    const updatedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(updatedClass).toHaveLength(1);
    expect(updatedClass[0].is_active).toBe(false);
    expect(updatedClass[0].updated_at).toBeInstanceOf(Date);

    // Verify schedule still exists
    const schedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.class_id, classId))
      .execute();

    expect(schedule).toHaveLength(1);
  });

  it('should throw error when class does not exist', async () => {
    const nonExistentClassId = 99999;

    await expect(deleteClass(nonExistentClassId)).rejects.toThrow(/Class with id 99999 not found/i);
  });

  it('should handle multiple schedules correctly for soft delete', async () => {
    // Create a test class
    const createdClass = await db.insert(classesTable)
      .values({
        name: testClassInput.name,
        description: testClassInput.description,
        class_type: testClassInput.class_type,
        instructor_name: testClassInput.instructor_name,
        max_capacity: testClassInput.max_capacity,
        duration_minutes: testClassInput.duration_minutes,
        price: testClassInput.price.toString()
      })
      .returning()
      .execute();

    const classId = createdClass[0].id;

    // Create multiple schedules for this class
    const scheduleStart1 = new Date();
    scheduleStart1.setDate(scheduleStart1.getDate() + 7);
    const scheduleEnd1 = new Date(scheduleStart1);
    scheduleEnd1.setMinutes(scheduleEnd1.getMinutes() + testClassInput.duration_minutes);

    const scheduleStart2 = new Date();
    scheduleStart2.setDate(scheduleStart2.getDate() + 14);
    const scheduleEnd2 = new Date(scheduleStart2);
    scheduleEnd2.setMinutes(scheduleEnd2.getMinutes() + testClassInput.duration_minutes);

    await db.insert(classSchedulesTable)
      .values([
        {
          class_id: classId,
          start_time: scheduleStart1,
          end_time: scheduleEnd1,
          room_name: 'Studio A'
        },
        {
          class_id: classId,
          start_time: scheduleStart2,
          end_time: scheduleEnd2,
          room_name: 'Studio B'
        }
      ])
      .execute();

    // Delete the class
    const result = await deleteClass(classId);

    expect(result.success).toBe(true);

    // Verify class is soft deleted
    const updatedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(updatedClass).toHaveLength(1);
    expect(updatedClass[0].is_active).toBe(false);

    // Verify all schedules still exist
    const schedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.class_id, classId))
      .execute();

    expect(schedules).toHaveLength(2);
  });

  it('should handle already inactive class with schedules', async () => {
    // Create an inactive test class
    const createdClass = await db.insert(classesTable)
      .values({
        name: testClassInput.name,
        description: testClassInput.description,
        class_type: testClassInput.class_type,
        instructor_name: testClassInput.instructor_name,
        max_capacity: testClassInput.max_capacity,
        duration_minutes: testClassInput.duration_minutes,
        price: testClassInput.price.toString(),
        is_active: false
      })
      .returning()
      .execute();

    const classId = createdClass[0].id;

    // Create a schedule for this class
    const scheduleStart = new Date();
    scheduleStart.setDate(scheduleStart.getDate() + 7);
    const scheduleEnd = new Date(scheduleStart);
    scheduleEnd.setMinutes(scheduleEnd.getMinutes() + testClassInput.duration_minutes);

    await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        start_time: scheduleStart,
        end_time: scheduleEnd,
        room_name: 'Studio A'
      })
      .execute();

    // Delete the class
    const result = await deleteClass(classId);

    expect(result.success).toBe(true);

    // Verify class remains inactive
    const updatedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(updatedClass).toHaveLength(1);
    expect(updatedClass[0].is_active).toBe(false);
  });
});
