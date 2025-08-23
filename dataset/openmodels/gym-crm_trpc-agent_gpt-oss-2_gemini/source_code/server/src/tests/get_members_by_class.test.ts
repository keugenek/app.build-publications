import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ClassIdInput, type Member } from '../schema';
import { getMembersByClass } from '../handlers/get_members_by_class';

// Helper to insert a class directly
const insertClass = async () => {
  const [classRecord] = await db
    .insert(classesTable)
    .values({
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      trainer: 'Alice',
      capacity: 20,
      date: '2023-01-01',
      time: '10:00', // TIME column accepts string "HH:MM"
    })
    .returning()
    .execute();
  return classRecord;
};

// Helper to insert a member directly
const insertMember = async (name: string, email: string, phone: string) => {
  const [member] = await db
    .insert(membersTable)
    .values({ name, email, phone })
    .returning()
    .execute();
  return member;
};

// Helper to create a reservation linking class and member
const insertReservation = async (class_id: number, member_id: number) => {
  await db
    .insert(reservationsTable)
    .values({ class_id, member_id })
    .execute();
};

describe('getMembersByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns all members booked for a given class', async () => {
    const classRec = await insertClass();
    const member1 = await insertMember('John Doe', 'john@example.com', '1234567890');
    const member2 = await insertMember('Jane Smith', 'jane@example.com', '0987654321');

    await insertReservation(classRec.id, member1.id);
    await insertReservation(classRec.id, member2.id);

    const input: ClassIdInput = { class_id: classRec.id };
    const members: Member[] = await getMembersByClass(input);

    expect(members).toHaveLength(2);
    const ids = members.map((m) => m.id).sort();
    expect(ids).toEqual([member1.id, member2.id].sort());
    // Verify fields are correctly returned
    const john = members.find((m) => m.id === member1.id)!;
    expect(john.name).toBe('John Doe');
    expect(john.email).toBe('john@example.com');
    expect(john.phone).toBe('1234567890');
  });

  it('returns an empty array when no members are booked for the class', async () => {
    const classRec = await insertClass();
    const input: ClassIdInput = { class_id: classRec.id };
    const members = await getMembersByClass(input);
    expect(members).toHaveLength(0);
  });
});
