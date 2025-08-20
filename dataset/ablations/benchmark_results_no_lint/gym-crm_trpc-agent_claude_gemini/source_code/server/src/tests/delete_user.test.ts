import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable, attendanceTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a regular user successfully', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input: DeleteEntityInput = { id: userId };

    // Delete the user
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent user', async () => {
    const input: DeleteEntityInput = { id: 9999 };

    const result = await deleteUser(input);

    expect(result.success).toBe(false);
  });

  it('should cascade delete instructor record when deleting instructor user', async () => {
    // Create a user with instructor role
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create instructor record
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: userId,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    const instructorId = instructorResult[0].id;

    // Delete the user
    const input: DeleteEntityInput = { id: userId };
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify instructor record was cascade deleted
    const instructors = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, instructorId))
      .execute();

    expect(instructors).toHaveLength(0);
  });

  it('should cancel confirmed bookings and cascade delete booking records', async () => {
    // Create instructor user
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorUserId = instructorUserResult[0].id;

    // Create instructor record
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUserId,
        specialization: 'Pilates'
      })
      .returning()
      .execute();

    const instructorId = instructorResult[0].id;

    // Create member user
    const memberUserResult = await db.insert(usersTable)
      .values({
        name: 'Member User',
        email: 'member@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    const memberUserId = memberUserResult[0].id;

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Morning Pilates',
        description: 'A relaxing pilates class',
        start_time: new Date('2024-02-01T09:00:00Z'),
        end_time: new Date('2024-02-01T10:00:00Z'),
        instructor_id: instructorId,
        max_capacity: 20
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Create a booking for the member user
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: memberUserId,
        class_id: classId,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    const bookingId = bookingResult[0].id;

    // Create attendance record
    await db.insert(attendanceTable)
      .values({
        booking_id: bookingId,
        attended: false
      })
      .execute();

    // Delete the member user
    const input: DeleteEntityInput = { id: memberUserId };
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, memberUserId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify booking was cascade deleted
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(bookings).toHaveLength(0);

    // Verify attendance record was cascade deleted
    const attendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.booking_id, bookingId))
      .execute();

    expect(attendance).toHaveLength(0);
  });

  it('should handle deletion of user with multiple bookings', async () => {
    // Create instructor user and instructor
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUserResult[0].id,
        specialization: 'Fitness'
      })
      .returning()
      .execute();

    // Create member user
    const memberUserResult = await db.insert(usersTable)
      .values({
        name: 'Active Member',
        email: 'active@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    const memberUserId = memberUserResult[0].id;

    // Create multiple classes
    const class1Result = await db.insert(classesTable)
      .values({
        name: 'Class 1',
        start_time: new Date('2024-02-01T09:00:00Z'),
        end_time: new Date('2024-02-01T10:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 10
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        name: 'Class 2',
        start_time: new Date('2024-02-02T09:00:00Z'),
        end_time: new Date('2024-02-02T10:00:00Z'),
        instructor_id: instructorResult[0].id,
        max_capacity: 15
      })
      .returning()
      .execute();

    // Create multiple bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          user_id: memberUserId,
          class_id: class1Result[0].id,
          booking_status: 'confirmed'
        },
        {
          user_id: memberUserId,
          class_id: class2Result[0].id,
          booking_status: 'waitlist'
        }
      ])
      .execute();

    // Delete the user
    const input: DeleteEntityInput = { id: memberUserId };
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, memberUserId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify all bookings for this user were cascade deleted
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.user_id, memberUserId))
      .execute();

    expect(bookings).toHaveLength(0);
  });

  it('should handle deletion of instructor user with classes and bookings', async () => {
    // Create instructor user
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Lead Instructor',
        email: 'lead@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorUserId = instructorUserResult[0].id;

    // Create instructor record
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUserId,
        specialization: 'CrossFit'
      })
      .returning()
      .execute();

    const instructorId = instructorResult[0].id;

    // Create member user
    const memberUserResult = await db.insert(usersTable)
      .values({
        name: 'Member',
        email: 'member@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    // Create class taught by this instructor
    const classResult = await db.insert(classesTable)
      .values({
        name: 'CrossFit Basics',
        start_time: new Date('2024-02-01T09:00:00Z'),
        end_time: new Date('2024-02-01T10:00:00Z'),
        instructor_id: instructorId,
        max_capacity: 12
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Create booking for the class
    await db.insert(bookingsTable)
      .values({
        user_id: memberUserResult[0].id,
        class_id: classId,
        booking_status: 'confirmed'
      })
      .execute();

    // Delete the instructor user
    const input: DeleteEntityInput = { id: instructorUserId };
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify instructor user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, instructorUserId))
      .execute();

    expect(users).toHaveLength(0);

    // Verify instructor record was cascade deleted
    const instructors = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, instructorId))
      .execute();

    expect(instructors).toHaveLength(0);

    // Verify class was cascade deleted (due to instructor foreign key)
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(classes).toHaveLength(0);

    // Verify bookings for the class were cascade deleted
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.class_id, classId))
      .execute();

    expect(bookings).toHaveLength(0);
  });
});
