import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable, attendanceTable } from '../db/schema';
import { type UpdateAttendanceInput } from '../schema';
import { updateAttendance } from '../handlers/update_attendance';
import { eq } from 'drizzle-orm';

describe('updateAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    // Create instructor user
    const instructorUser = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create instructor
    const instructor = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser[0].id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    // Create class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        instructor_id: instructor[0].id,
        max_capacity: 20
      })
      .returning()
      .execute();

    // Create booking
    const booking = await db.insert(bookingsTable)
      .values({
        user_id: user[0].id,
        class_id: testClass[0].id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    // Create attendance record
    const attendance = await db.insert(attendanceTable)
      .values({
        booking_id: booking[0].id,
        attended: false,
        notes: null
      })
      .returning()
      .execute();

    return {
      user: user[0],
      instructor: instructor[0],
      class: testClass[0],
      booking: booking[0],
      attendance: attendance[0]
    };
  };

  it('should update attendance status to true', async () => {
    const { attendance } = await createTestData();

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      attended: true
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(true);
    expect(result.checked_in_at).toBeInstanceOf(Date);
    expect(result.notes).toBeNull();
  });

  it('should update attendance status to false and clear check-in time', async () => {
    const { attendance } = await createTestData();

    // First set attendance to true
    await db.update(attendanceTable)
      .set({ attended: true, checked_in_at: new Date() })
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      attended: false
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(false);
    expect(result.checked_in_at).toBeNull();
  });

  it('should update notes without changing attendance', async () => {
    const { attendance } = await createTestData();

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      notes: 'Student arrived late but participated fully'
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(false); // Original value
    expect(result.notes).toEqual('Student arrived late but participated fully');
  });

  it('should update check-in time with custom timestamp', async () => {
    const { attendance } = await createTestData();
    const customTime = new Date('2024-01-15T09:15:00Z');

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      attended: true,
      checked_in_at: customTime
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(true);
    expect(result.checked_in_at).toEqual(customTime);
  });

  it('should update multiple fields simultaneously', async () => {
    const { attendance } = await createTestData();
    const customTime = new Date('2024-01-15T09:10:00Z');

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      attended: true,
      checked_in_at: customTime,
      notes: 'Student checked in early'
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(true);
    expect(result.checked_in_at).toEqual(customTime);
    expect(result.notes).toEqual('Student checked in early');
  });

  it('should save changes to database', async () => {
    const { attendance } = await createTestData();

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      attended: true,
      notes: 'Great participation'
    };

    await updateAttendance(input);

    // Verify changes were saved to database
    const savedRecord = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    expect(savedRecord).toHaveLength(1);
    expect(savedRecord[0].attended).toBe(true);
    expect(savedRecord[0].checked_in_at).toBeInstanceOf(Date);
    expect(savedRecord[0].notes).toEqual('Great participation');
  });

  it('should set notes to null when explicitly provided', async () => {
    const { attendance } = await createTestData();

    // First set some notes
    await db.update(attendanceTable)
      .set({ notes: 'Initial notes' })
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      notes: null
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.notes).toBeNull();
  });

  it('should handle attendance being set to false with explicit check-in time', async () => {
    const { attendance } = await createTestData();
    const customTime = new Date('2024-01-15T09:30:00Z');

    const input: UpdateAttendanceInput = {
      id: attendance.id,
      attended: false,
      checked_in_at: customTime
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(false);
    expect(result.checked_in_at).toEqual(customTime);
  });

  it('should throw error when attendance record does not exist', async () => {
    const input: UpdateAttendanceInput = {
      id: 999999,
      attended: true
    };

    await expect(updateAttendance(input)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const { attendance } = await createTestData();

    // Set initial state
    await db.update(attendanceTable)
      .set({ 
        attended: true, 
        checked_in_at: new Date('2024-01-15T09:00:00Z'),
        notes: 'Original notes'
      })
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    // Only update notes
    const input: UpdateAttendanceInput = {
      id: attendance.id,
      notes: 'Updated notes only'
    };

    const result = await updateAttendance(input);

    expect(result.id).toEqual(attendance.id);
    expect(result.attended).toBe(true); // Unchanged
    expect(result.checked_in_at).toBeInstanceOf(Date); // Unchanged
    expect(result.notes).toEqual('Updated notes only'); // Changed
  });
});
