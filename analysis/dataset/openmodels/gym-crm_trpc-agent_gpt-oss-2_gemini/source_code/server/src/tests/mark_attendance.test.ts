import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, reservationsTable } from '../db/schema';
import { markAttendance } from '../handlers/mark_attendance';
import type { MarkAttendanceInput } from '../schema';

describe('markAttendance handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark attendance for an existing reservation', async () => {
    // Insert a class
    const classResult = await db
      .insert(classesTable)
      .values({
        name: 'Yoga Basics',
        description: 'Introductory yoga class',
        trainer: 'Alice',
        capacity: 20,
        date: '2025-01-01',
        time: '10:00:00',
      })
      .returning()
      .execute();
    const classRecord = classResult[0];

    // Insert a member
    const memberResult = await db
      .insert(membersTable)
      .values({
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '555-1234',
      })
      .returning()
      .execute();
    const memberRecord = memberResult[0];

    // Insert a reservation (attended = null initially)
    const reservationResult = await db
      .insert(reservationsTable)
      .values({
        class_id: classRecord.id,
        member_id: memberRecord.id,
        attended: null,
      })
      .returning()
      .execute();
    const reservationRecord = reservationResult[0];

    // Mark attendance
    const input: MarkAttendanceInput = {
      id: reservationRecord.id,
      attended: true,
    };
    const updated = await markAttendance(input);

    expect(updated.id).toBe(reservationRecord.id);
    expect(updated.attended).toBe(true);

    // Verify persisted value in DB
    const persisted = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservationRecord.id))
      .execute();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].attended).toBe(true);
  });

  it('should throw an error when reservation does not exist', async () => {
    const input: MarkAttendanceInput = {
      id: 9999, // non‑existent id
      attended: false,
    };
    await expect(markAttendance(input)).rejects.toThrow(/not found/i);
  });
});
