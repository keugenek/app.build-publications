import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable, attendanceTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { deleteClass } from '../handlers/delete_class';
import { eq } from 'drizzle-orm';

// Test input for deleting a class
const testInput: DeleteEntityInput = {
  id: 1
};

describe('deleteClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a class successfully', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructor = await db.insert(instructorsTable)
      .values({
        user_id: user[0].id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    // Create a test class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        start_time: new Date('2024-01-15T08:00:00Z'),
        end_time: new Date('2024-01-15T09:00:00Z'),
        instructor_id: instructor[0].id,
        max_capacity: 20
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass({ id: testClass[0].id });

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the class is actually deleted from database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass[0].id))
      .execute();

    expect(classes).toHaveLength(0);
  });

  it('should handle cascade deletion of bookings and attendance', async () => {
    // Create prerequisite data - user and instructor
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Instructor User',
          email: 'instructor@example.com',
          role: 'instructor'
        },
        {
          name: 'Member User',
          email: 'member@example.com',
          role: 'member'
        }
      ])
      .returning()
      .execute();

    const instructor = await db.insert(instructorsTable)
      .values({
        user_id: users[0].id,
        specialization: 'Pilates',
        bio: 'Certified pilates instructor'
      })
      .returning()
      .execute();

    // Create a test class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Pilates Class',
        description: 'Core strengthening pilates',
        start_time: new Date('2024-01-16T10:00:00Z'),
        end_time: new Date('2024-01-16T11:00:00Z'),
        instructor_id: instructor[0].id,
        max_capacity: 15
      })
      .returning()
      .execute();

    // Create a booking for the class
    const booking = await db.insert(bookingsTable)
      .values({
        user_id: users[1].id,
        class_id: testClass[0].id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    // Create attendance record for the booking
    await db.insert(attendanceTable)
      .values({
        booking_id: booking[0].id,
        attended: true,
        notes: 'Great session'
      })
      .execute();

    // Delete the class
    const result = await deleteClass({ id: testClass[0].id });

    // Verify the result
    expect(result.success).toBe(true);

    // Verify cascade deletion worked
    const remainingClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass[0].id))
      .execute();

    const remainingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.class_id, testClass[0].id))
      .execute();

    const remainingAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.booking_id, booking[0].id))
      .execute();

    expect(remainingClasses).toHaveLength(0);
    expect(remainingBookings).toHaveLength(0);
    expect(remainingAttendance).toHaveLength(0);
  });

  it('should throw error when class does not exist', async () => {
    // Try to delete a non-existent class
    await expect(deleteClass({ id: 999 })).rejects.toThrow(/Class with id 999 not found/i);
  });

  it('should not affect other classes when deleting one', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructor = await db.insert(instructorsTable)
      .values({
        user_id: user[0].id,
        specialization: 'CrossFit',
        bio: 'Certified CrossFit trainer'
      })
      .returning()
      .execute();

    // Create two test classes
    const classes = await db.insert(classesTable)
      .values([
        {
          name: 'Morning CrossFit',
          description: 'High intensity morning workout',
          start_time: new Date('2024-01-17T07:00:00Z'),
          end_time: new Date('2024-01-17T08:00:00Z'),
          instructor_id: instructor[0].id,
          max_capacity: 12
        },
        {
          name: 'Evening CrossFit',
          description: 'High intensity evening workout',
          start_time: new Date('2024-01-17T18:00:00Z'),
          end_time: new Date('2024-01-17T19:00:00Z'),
          instructor_id: instructor[0].id,
          max_capacity: 12
        }
      ])
      .returning()
      .execute();

    // Delete the first class
    const result = await deleteClass({ id: classes[0].id });

    // Verify the result
    expect(result.success).toBe(true);

    // Verify only the first class was deleted
    const remainingClasses = await db.select()
      .from(classesTable)
      .execute();

    expect(remainingClasses).toHaveLength(1);
    expect(remainingClasses[0].id).toBe(classes[1].id);
    expect(remainingClasses[0].name).toBe('Evening CrossFit');
  });
});
